import express from "express";
import { query, queryOne, withTransaction } from "../db.js";
import {
  acknowledgeNextInnings,
  applyScoreEvent,
  buildMatchRowUpdate,
  buildPublicInningsState,
  confirmNextBatter,
  confirmNextBowler,
  finalizeMatch,
  hydrateLiveData,
  startInnings,
} from "../scoring.js";
import { authenticateToken, requireRole } from "./auth.js";
import { broadcastScoreUpdate, broadcastCommentary } from "../socket.js";

const router = express.Router();

function fixtureStatusForPhase(liveData) {
  const phase = liveData?.current?.phase;
  const pending = liveData?.current?.pendingInningsTransition;

  if (phase === "completed") return "completed";
  if (phase === "live" || phase === "innings_break" || pending) return "live";
  return "scheduled";
}

async function getFixtureBundle(fixtureId) {
  const fixture = await queryOne(
    `
      SELECT
        f.*,
        tournament.rules AS tournament_rules,
        team1.name AS team1_name,
        team2.name AS team2_name
      FROM fixtures f
      INNER JOIN tournaments tournament ON tournament.id = f.tournament_id
      LEFT JOIN teams team1 ON team1.id = f.team1_id
      LEFT JOIN teams team2 ON team2.id = f.team2_id
      WHERE f.id = $1
    `,
    [fixtureId],
  );

  return fixture;
}

function activeCards(liveData) {
  const inningsState = buildPublicInningsState(liveData, liveData.current.inningsNumber || 1);
  if (!inningsState) {
    return {
      inningsState: null,
      strikerCard: null,
      nonStrikerCard: null,
      bowlerCard: null,
      availableNextBatters: [],
      availableBowlers: [],
    };
  }

  const strikerCard = inningsState.batsmen.find(
    (batter) => Number(batter.playerId) === Number(liveData.current.strikerId),
  ) || null;
  const nonStrikerCard = inningsState.batsmen.find(
    (batter) => Number(batter.playerId) === Number(liveData.current.nonStrikerId),
  ) || null;
  const inningsKey = String(liveData.current.inningsNumber || 1);
  const rawBowler = liveData.innings?.[inningsKey]?.bowlers?.[String(liveData.current.bowlerId)];
  const bowlerFromList = inningsState.bowlers.find(
    (bowler) => Number(bowler.playerId) === Number(liveData.current.bowlerId),
  ) || null;
  const bowlerCard = bowlerFromList
    ? {
        ...bowlerFromList,
        currentOverDeliveries: bowlerFromList.currentOverDeliveries
          ?? rawBowler?.currentOverDeliveries
          ?? [],
        lastOverDeliveries: bowlerFromList.lastOverDeliveries
          ?? rawBowler?.lastOverDeliveries
          ?? [],
      }
    : null;
  const availableNextBatters = inningsState.batsmen.filter((batter) => batter.status === "yet_to_bat");
  const availableBowlers = inningsState.bowlers;

  return {
    inningsState,
    strikerCard,
    nonStrikerCard,
    bowlerCard,
    availableNextBatters,
    availableBowlers,
  };
}

function buildMatchResponse(matchRow, fixture) {
  const liveData = hydrateLiveData(matchRow.live_data, matchRow);
  const innings1 = buildPublicInningsState(liveData, 1);
  const innings2 = buildPublicInningsState(liveData, 2);
  const { inningsState, strikerCard, nonStrikerCard, bowlerCard, availableNextBatters, availableBowlers } = activeCards(liveData);

  return {
    ...matchRow,
    team1Name: fixture?.team1_name || "Team 1",
    team2Name: fixture?.team2_name || "Team 2",
    ground: fixture?.ground || "Ground TBD",
    liveData,
    innings1,
    innings2,
    currentInningsState: inningsState,
    strikerName: strikerCard?.name || null,
    nonStrikerName: nonStrikerCard?.name || null,
    bowlerName: bowlerCard?.name || null,
    strikerCard,
    nonStrikerCard,
    bowlerCard,
    availableNextBatters,
    availableBowlers,
    targetRuns: liveData.current.targetRuns,
    toss: liveData.toss,
    result: liveData.result,
    requiresNewBowler: Boolean(liveData.current?.requiresNewBowler),
    requiresNewBatter: Boolean(liveData.current?.requiresNewBatter),
    pendingInningsTransition: liveData.current?.pendingInningsTransition || null,
  };
}

async function persistMatchState(client, matchRow, liveData) {
  const updated = buildMatchRowUpdate(matchRow, liveData);
  const fixtureStatus = fixtureStatusForPhase(liveData);

  const matchRes = await client.query(
    `
      UPDATE match_state
      SET
        current_innings = $2,
        current_over = $3,
        current_ball = $4,
        striker_id = $5,
        non_striker_id = $6,
        bowler_id = $7,
        team1_score = $8::jsonb,
        team2_score = $9::jsonb,
        status = $10::match_status,
        live_data = $11::jsonb,
        revision = revision + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE fixture_id = $1
      RETURNING *
    `,
    [
      matchRow.fixture_id,
      updated.currentInnings,
      updated.currentOver,
      updated.currentBall,
      updated.strikerId,
      updated.nonStrikerId,
      updated.bowlerId,
      JSON.stringify(updated.team1Score),
      JSON.stringify(updated.team2Score),
      fixtureStatus,
      JSON.stringify(updated.liveData),
    ],
  );

  await client.query(
    `
      UPDATE fixtures
      SET
        status = $2::match_status,
        result_summary = $3
      WHERE id = $1
    `,
    [
      matchRow.fixture_id,
      fixtureStatus,
      liveData.result?.summary || null,
    ],
  );

  return matchRes.rows[0];
}

async function executeScoreUpdate(fixtureId, input) {
  const payload = await withTransaction(async (client) => {
    const matchRes = await client.query(
      "SELECT * FROM match_state WHERE fixture_id = $1 FOR UPDATE",
      [fixtureId],
    );
    const matchRow = matchRes.rows[0];
    if (!matchRow) {
      throw new Error("MATCH_NOT_FOUND");
    }

    const liveData = hydrateLiveData(matchRow.live_data, matchRow);
    const stateBefore = JSON.parse(JSON.stringify(liveData));
    const { liveData: updatedLiveData, commentary, summary } = applyScoreEvent(liveData, input);

    const savedMatch = await persistMatchState(client, matchRow, updatedLiveData);

    const commentaryRes = await client.query(
      `
        INSERT INTO ball_commentary (
          match_id, innings, over_num, ball_num, batsman_id, bowler_id,
          runs, extra_runs, extra_type, wicket_type, dismissed_player_id,
          description, event_data, state_before, state_after
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::extra_type, $10::wicket_type, $11, $12, $13::jsonb, $14::jsonb, $15::jsonb)
        RETURNING *
      `,
      [
        matchRow.id,
        savedMatch.current_innings,
        savedMatch.current_over,
        savedMatch.current_ball,
        stateBefore.current.strikerId,
        input.bowlerId ? Number(input.bowlerId) : stateBefore.current.bowlerId,
        Number(input.runs || 0),
        Number(input.extraRuns || 0),
        input.extraType || null,
        input.wicketType || null,
        input.dismissedPlayerId ? Number(input.dismissedPlayerId) : null,
        commentary,
        JSON.stringify({
          input,
          summary,
        }),
        JSON.stringify(stateBefore),
        JSON.stringify(updatedLiveData),
      ],
    );

    return {
      matchState: savedMatch,
      commentary: commentaryRes.rows[0],
    };
  });

  const fixture = await getFixtureBundle(fixtureId);
  const responseData = buildMatchResponse(payload.matchState, fixture);
  broadcastScoreUpdate(fixtureId, responseData);
  broadcastCommentary(fixtureId, payload.commentary);

  return {
    matchState: responseData,
    commentary: payload.commentary,
  };
}

router.get("/live", async (req, res) => {
  try {
    const liveMatches = await query(
      `
        SELECT
          ms.*,
          f.ground,
          f.match_date,
          team1.name AS team1_name,
          team2.name AS team2_name
        FROM match_state ms
        INNER JOIN fixtures f ON f.id = ms.fixture_id
        LEFT JOIN teams team1 ON team1.id = f.team1_id
        LEFT JOIN teams team2 ON team2.id = f.team2_id
        WHERE ms.status = 'live'
        ORDER BY f.match_date ASC, ms.fixture_id ASC
      `,
    );

    return res.json({
      success: true,
      data: liveMatches.map((match) => buildMatchResponse(match, match)),
    });
  } catch (err) {
    console.error("[Matches] Failed to fetch live matches:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch live matches." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const fixtureId = parseInt(req.params.id, 10);
    const match = await queryOne("SELECT * FROM match_state WHERE fixture_id = $1", [fixtureId]);

    if (!match) {
      return res.status(404).json({ success: false, message: "Match details not found" });
    }

    const fixture = await getFixtureBundle(fixtureId);
    return res.json({ success: true, data: buildMatchResponse(match, fixture) });
  } catch (err) {
    console.error("[Matches] Failed to fetch match:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch match details." });
  }
});

router.get("/:id/commentary", async (req, res) => {
  try {
    const fixtureId = parseInt(req.params.id, 10);
    const commentary = await query(
      `
        SELECT *
        FROM ball_commentary
        WHERE match_id = (
          SELECT id FROM match_state WHERE fixture_id = $1
        )
        ORDER BY id DESC
      `,
      [fixtureId],
    );
    return res.json({ success: true, data: commentary });
  } catch (err) {
    console.error("[Matches] Failed to fetch commentary:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch commentary." });
  }
});

router.post("/:id/start", authenticateToken, requireRole("scorer", "super_admin"), async (req, res) => {
  try {
    const fixtureId = parseInt(req.params.id, 10);

    const saved = await withTransaction(async (client) => {
      const matchRes = await client.query(
        "SELECT * FROM match_state WHERE fixture_id = $1 FOR UPDATE",
        [fixtureId],
      );
      const matchRow = matchRes.rows[0];
      if (!matchRow) {
        throw new Error("MATCH_NOT_FOUND");
      }

      const liveData = hydrateLiveData(matchRow.live_data, matchRow);
      const updatedLiveData = startInnings(liveData, {
        inningsNumber: Number(req.body.inningsNumber || liveData.current.inningsNumber || 1),
        battingTeamId: Number(req.body.battingTeamId),
        bowlingTeamId: Number(req.body.bowlingTeamId),
        strikerId: Number(req.body.strikerId),
        nonStrikerId: Number(req.body.nonStrikerId),
        bowlerId: Number(req.body.bowlerId),
        tossWinnerTeamId: req.body.tossWinnerTeamId ? Number(req.body.tossWinnerTeamId) : null,
        tossDecision: req.body.tossDecision || null,
      });

      return persistMatchState(client, matchRow, updatedLiveData);
    });

    const fixture = await getFixtureBundle(fixtureId);
    const responseData = buildMatchResponse(saved, fixture);
    broadcastScoreUpdate(fixtureId, responseData);

    return res.json({
      success: true,
      message: "Innings started successfully.",
      data: responseData,
    });
  } catch (err) {
    if (err.message === "MATCH_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Match state not found." });
    }
    console.error("[Matches] Failed to start innings:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to start innings." });
  }
});

router.post("/:id/score", authenticateToken, requireRole("scorer", "super_admin"), async (req, res) => {
  try {
    const fixtureId = parseInt(req.params.id, 10);
    const payload = await executeScoreUpdate(fixtureId, {
      runs: Number(req.body.runs || 0),
      extraRuns: Number(req.body.extraRuns || 0),
      extraType: req.body.extraType || null,
      wicketType: req.body.wicketType || null,
      dismissedPlayerId: req.body.dismissedPlayerId ? Number(req.body.dismissedPlayerId) : null,
      fielderId: req.body.fielderId ? Number(req.body.fielderId) : null,
      nextBatterId: req.body.nextBatterId ? Number(req.body.nextBatterId) : null,
      bowlerId: req.body.bowlerId ? Number(req.body.bowlerId) : null,
      nextBowlerId: req.body.nextBowlerId ? Number(req.body.nextBowlerId) : null,
    });

    return res.json({
      success: true,
      message: "Score updated successfully.",
      matchState: payload.matchState,
      newBall: payload.commentary,
    });
  } catch (err) {
    if (err.message === "MATCH_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Live match not active." });
    }
    console.error("[Matches] Failed to update score:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to update score." });
  }
});

router.post("/:id/ball", authenticateToken, requireRole("scorer", "super_admin"), async (req, res) => {
  try {
    const fixtureId = parseInt(req.params.id, 10);
    const payload = await executeScoreUpdate(fixtureId, {
      runs: Number(req.body.runs || 0),
      extraType: req.body.extras_type || null,
      extraRuns: req.body.extras_type ? Number(req.body.extraRuns || req.body.runs || 1) : 0,
      wicketType: req.body.wicket ? "caught" : null,
      bowlerId: req.body.bowlerId ? Number(req.body.bowlerId) : null,
      nextBatterId: req.body.nextBatterId ? Number(req.body.nextBatterId) : null,
      nextBowlerId: req.body.nextBowlerId ? Number(req.body.nextBowlerId) : null,
    });

    return res.json({
      success: true,
      message: "Score updated successfully.",
      matchState: payload.matchState,
      newBall: payload.commentary,
    });
  } catch (err) {
    if (err.message === "MATCH_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Live match not active." });
    }
    console.error("[Matches] Failed to submit ball:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to submit ball." });
  }
});

async function applyLiveDataUpdate(fixtureId, updater) {
  const saved = await withTransaction(async (client) => {
    const matchRes = await client.query(
      "SELECT * FROM match_state WHERE fixture_id = $1 FOR UPDATE",
      [fixtureId],
    );
    const matchRow = matchRes.rows[0];
    if (!matchRow) {
      throw new Error("MATCH_NOT_FOUND");
    }

    const liveData = hydrateLiveData(matchRow.live_data, matchRow);
    const updatedLiveData = updater(liveData);
    return persistMatchState(client, matchRow, updatedLiveData);
  });

  const fixture = await getFixtureBundle(fixtureId);
  const responseData = buildMatchResponse(saved, fixture);
  broadcastScoreUpdate(fixtureId, responseData);
  return responseData;
}

router.post("/:id/select-batter", authenticateToken, requireRole("scorer", "super_admin"), async (req, res) => {
  try {
    const fixtureId = parseInt(req.params.id, 10);
    const nextBatterId = Number(req.body.nextBatterId);

    if (!nextBatterId) {
      return res.status(400).json({ success: false, message: "nextBatterId is required." });
    }

    const responseData = await applyLiveDataUpdate(fixtureId, (liveData) =>
      confirmNextBatter(liveData, nextBatterId),
    );

    return res.json({
      success: true,
      message: "Next batter confirmed.",
      matchState: responseData,
    });
  } catch (err) {
    if (err.message === "MATCH_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Match state not found." });
    }
    console.error("[Matches] Failed to select batter:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to select batter." });
  }
});

router.post("/:id/acknowledge-next-innings", authenticateToken, requireRole("scorer", "super_admin"), async (req, res) => {
  try {
    const fixtureId = parseInt(req.params.id, 10);
    const responseData = await applyLiveDataUpdate(fixtureId, (liveData) => acknowledgeNextInnings(liveData));

    return res.json({
      success: true,
      message: "Ready for second innings setup.",
      matchState: responseData,
    });
  } catch (err) {
    if (err.message === "MATCH_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Match state not found." });
    }
    console.error("[Matches] Failed to acknowledge next innings:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to proceed to next innings." });
  }
});

router.post("/:id/end-match", authenticateToken, requireRole("scorer", "super_admin"), async (req, res) => {
  try {
    const fixtureId = parseInt(req.params.id, 10);
    const responseData = await applyLiveDataUpdate(fixtureId, (liveData) => finalizeMatch(liveData));

    return res.json({
      success: true,
      message: "Match completed successfully.",
      matchState: responseData,
    });
  } catch (err) {
    if (err.message === "MATCH_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Match state not found." });
    }
    console.error("[Matches] Failed to end match:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to end match." });
  }
});

router.post("/:id/select-bowler", authenticateToken, requireRole("scorer", "super_admin"), async (req, res) => {
  try {
    const fixtureId = parseInt(req.params.id, 10);
    const nextBowlerId = Number(req.body.nextBowlerId);

    if (!nextBowlerId) {
      return res.status(400).json({ success: false, message: "nextBowlerId is required." });
    }

    const responseData = await applyLiveDataUpdate(fixtureId, (liveData) =>
      confirmNextBowler(liveData, nextBowlerId),
    );

    return res.json({
      success: true,
      message: "Next bowler confirmed.",
      matchState: responseData,
    });
  } catch (err) {
    if (err.message === "MATCH_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Match state not found." });
    }
    console.error("[Matches] Failed to select bowler:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to select bowler." });
  }
});

router.post("/:id/undo", authenticateToken, requireRole("scorer", "super_admin"), async (req, res) => {
  try {
    const fixtureId = parseInt(req.params.id, 10);

    const restored = await withTransaction(async (client) => {
      const matchRes = await client.query(
        "SELECT * FROM match_state WHERE fixture_id = $1 FOR UPDATE",
        [fixtureId],
      );
      const matchRow = matchRes.rows[0];
      if (!matchRow) {
        throw new Error("MATCH_NOT_FOUND");
      }

      const lastBallRes = await client.query(
        `
          SELECT *
          FROM ball_commentary
          WHERE match_id = $1
          ORDER BY id DESC
          LIMIT 1
        `,
        [matchRow.id],
      );
      const lastBall = lastBallRes.rows[0];
      if (!lastBall) {
        throw new Error("NO_BALL_TO_UNDO");
      }

      const previousState = lastBall.state_before;
      if (!previousState) {
        throw new Error("UNDO_STATE_MISSING");
      }

      const savedMatch = await persistMatchState(client, matchRow, previousState);
      await client.query("DELETE FROM ball_commentary WHERE id = $1", [lastBall.id]);
      return savedMatch;
    });

    const fixture = await getFixtureBundle(fixtureId);
    const responseData = buildMatchResponse(restored, fixture);
    broadcastScoreUpdate(fixtureId, responseData);

    return res.json({
      success: true,
      message: "Undone last ball action.",
      matchState: responseData,
    });
  } catch (err) {
    if (err.message === "MATCH_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Match state not found." });
    }
    if (err.message === "NO_BALL_TO_UNDO") {
      return res.status(400).json({ success: false, message: "No score actions to undo." });
    }
    console.error("[Matches] Failed to undo ball:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to undo last ball." });
  }
});

export default router;
