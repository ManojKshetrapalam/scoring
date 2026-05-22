import express from "express";
import { query, queryOne, withTransaction } from "../db.js";
import { authenticateToken, requireRole } from "./auth.js";
import { createInitialLiveData, createLineupPayload } from "../scoring.js";
import { sanitizePlayers } from "./tournamentHelpers.js";

const router = express.Router();

async function upsertFriendlyTeam(client, teamPayload, defaultPlayersPerTeam) {
  if (!teamPayload?.name && !teamPayload?.id) {
    throw new Error("Each team must have either an id or a name.");
  }

  let team;
  if (teamPayload.id) {
    const teamRes = await client.query(
      "SELECT * FROM teams WHERE id = $1 AND tournament_id IS NULL LIMIT 1",
      [Number(teamPayload.id)],
    );
    team = teamRes.rows[0];
  } else {
    const existingRes = await client.query(
      "SELECT * FROM teams WHERE tournament_id IS NULL AND name = $1 LIMIT 1",
      [teamPayload.name],
    );
    team = existingRes.rows[0];
  }

  if (!team) {
    const insertRes = await client.query(
      `
        INSERT INTO teams (
          tournament_id, name, company_name, jersey_color, logo_url, status, payment_status
        )
        VALUES (NULL, $1, $2, $3, $4, 'approved', 'paid')
        RETURNING *
      `,
      [
        teamPayload.name,
        teamPayload.companyName || teamPayload.company_name || teamPayload.name,
        teamPayload.jerseyColor || teamPayload.jersey_color || null,
        teamPayload.logoUrl || teamPayload.logo_url || null,
      ],
    );
    team = insertRes.rows[0];
  }

  const sanitizedPlayers = sanitizePlayers(teamPayload.players || []);
  const players = [];

  for (const player of sanitizedPlayers) {
    let playerRow = null;
    if (player.id) {
      const byIdRes = await client.query(
        "SELECT * FROM players WHERE id = $1 AND team_id = $2 LIMIT 1",
        [player.id, team.id],
      );
      playerRow = byIdRes.rows[0];
    }

    if (!playerRow) {
      const byNameRes = await client.query(
        "SELECT * FROM players WHERE team_id = $1 AND name = $2 LIMIT 1",
        [team.id, player.name],
      );
      playerRow = byNameRes.rows[0];
    }

    if (!playerRow) {
      const insertPlayerRes = await client.query(
        `
          INSERT INTO players (
            team_id, name, jersey_number, batting_style, bowling_style,
            is_captain, is_vice_captain, is_wicket_keeper
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `,
        [
          team.id,
          player.name,
          player.jerseyNumber,
          player.battingStyle,
          player.bowlingStyle,
          player.isCaptain,
          player.isViceCaptain,
          player.isWicketKeeper,
        ],
      );
      playerRow = insertPlayerRes.rows[0];
    } else {
      const updatePlayerRes = await client.query(
        `
          UPDATE players
          SET
            jersey_number = COALESCE($2, jersey_number),
            batting_style = COALESCE($3, batting_style),
            bowling_style = COALESCE($4, bowling_style),
            is_captain = $5,
            is_vice_captain = $6,
            is_wicket_keeper = $7
          WHERE id = $1
          RETURNING *
        `,
        [
          playerRow.id,
          player.jerseyNumber,
          player.battingStyle,
          player.bowlingStyle,
          player.isCaptain,
          player.isViceCaptain,
          player.isWicketKeeper,
        ],
      );
      playerRow = updatePlayerRes.rows[0];
    }

    players.push(playerRow);
  }

  const lineup = createLineupPayload({
    teamId: team.id,
    players,
    playersPerTeam: Number(teamPayload.playersPerTeam || defaultPlayersPerTeam),
  });

  return { team, players, lineup };
}

function parseRules(body = {}) {
  return {
    overs: Number(body.overs || 20),
    players_per_team: Number(body.playersPerTeam || body.players_per_team || 11),
    powerplay_overs: 0,
    free_hit: true,
    wide_value: 1,
    noball_value: 1,
  };
}

router.get("/", async (req, res) => {
  try {
    const friendlies = await query(
      `
        SELECT
          f.*,
          team1.name AS team1_name,
          team2.name AS team2_name,
          ms.status AS live_status
        FROM fixtures f
        LEFT JOIN teams team1 ON team1.id = f.team1_id
        LEFT JOIN teams team2 ON team2.id = f.team2_id
        LEFT JOIN match_state ms ON ms.fixture_id = f.id
        WHERE f.tournament_id IS NULL
           OR COALESCE(f.match_kind, 'tournament') = 'friendly'
        ORDER BY f.match_date DESC, f.id DESC
      `,
    );
    return res.json({ success: true, data: friendlies });
  } catch (err) {
    console.error("[Friendlies] Failed to list:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch friendly matches." });
  }
});

router.post("/", authenticateToken, requireRole("scorer", "super_admin"), async (req, res) => {
  try {
    const { title, matchDate, ground, team1, team2, overs, playersPerTeam } = req.body;

    if (!matchDate || !ground || !team1 || !team2) {
      return res.status(400).json({
        success: false,
        message: "Match date, ground, and both teams are required.",
      });
    }

    const rules = parseRules(req.body);
    const oversLimit = rules.overs;
    const defaultPlayersPerTeam = rules.players_per_team;

    const payload = await withTransaction(async (client) => {
      const team1State = await upsertFriendlyTeam(client, team1, defaultPlayersPerTeam);
      const team2State = await upsertFriendlyTeam(client, team2, defaultPlayersPerTeam);

      if (team1State.team.id === team2State.team.id) {
        throw new Error("A match must have two different teams.");
      }

      const fixtureRes = await client.query(
        `
          INSERT INTO fixtures (
            tournament_id, team1_id, team2_id, match_date, ground, scorer_id, status,
            match_kind, title, overs_limit
          )
          VALUES (NULL, $1, $2, $3, $4, $5, 'scheduled', 'friendly', $6, $7)
          RETURNING *
        `,
        [
          team1State.team.id,
          team2State.team.id,
          matchDate,
          ground,
          req.user.userId,
          title || `${team1State.team.name} vs ${team2State.team.name}`,
          oversLimit,
        ],
      );

      const liveData = createInitialLiveData({
        team1Lineup: team1State.lineup,
        team2Lineup: team2State.lineup,
        oversLimit,
      });

      const matchStateRes = await client.query(
        `
          INSERT INTO match_state (
            fixture_id, current_innings, current_over, current_ball,
            striker_id, non_striker_id, bowler_id,
            team1_score, team2_score, status, live_data
          )
          VALUES ($1, 1, 0, 0, NULL, NULL, NULL, $2::jsonb, $3::jsonb, 'scheduled', $4::jsonb)
          RETURNING *
        `,
        [
          fixtureRes.rows[0].id,
          JSON.stringify({ runs: 0, wickets: 0, overs: 0, extras: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, runRate: 0 }),
          JSON.stringify({ runs: 0, wickets: 0, overs: 0, extras: 0, wides: 0, noBalls: 0, byes: 0, legByes: 0, runRate: 0 }),
          JSON.stringify(liveData),
        ],
      );

      return { fixture: fixtureRes.rows[0], matchState: matchStateRes.rows[0] };
    });

    return res.status(201).json({
      success: true,
      message: "Friendly match created.",
      data: payload,
    });
  } catch (err) {
    console.error("[Friendlies] Failed to create:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to create friendly match." });
  }
});

router.put("/:id", authenticateToken, requireRole("scorer", "super_admin"), async (req, res) => {
  try {
    const fixtureId = parseInt(req.params.id, 10);
    const { title, matchDate, ground, overs } = req.body;

    const existing = await queryOne(
      "SELECT * FROM fixtures WHERE id = $1 AND (tournament_id IS NULL OR COALESCE(match_kind, 'tournament') = 'friendly')",
      [fixtureId],
    );
    if (!existing) {
      return res.status(404).json({ success: false, message: "Friendly match not found." });
    }

    const live = await queryOne("SELECT status FROM match_state WHERE fixture_id = $1", [fixtureId]);
    if (live?.status === "live") {
      return res.status(400).json({ success: false, message: "Cannot edit a live match." });
    }

    const updated = await queryOne(
      `
        UPDATE fixtures
        SET
          title = COALESCE($2, title),
          match_date = COALESCE($3, match_date),
          ground = COALESCE($4, ground),
          overs_limit = COALESCE($5, overs_limit)
        WHERE id = $1
        RETURNING *
      `,
      [fixtureId, title || null, matchDate || null, ground || null, overs ? Number(overs) : null],
    );

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error("[Friendlies] Failed to update:", err);
    return res.status(500).json({ success: false, message: "Failed to update friendly match." });
  }
});

router.delete("/:id", authenticateToken, requireRole("scorer", "super_admin"), async (req, res) => {
  try {
    const fixtureId = parseInt(req.params.id, 10);
    const existing = await queryOne(
      "SELECT * FROM fixtures WHERE id = $1 AND (tournament_id IS NULL OR COALESCE(match_kind, 'tournament') = 'friendly')",
      [fixtureId],
    );
    if (!existing) {
      return res.status(404).json({ success: false, message: "Friendly match not found." });
    }

    const live = await queryOne("SELECT status FROM match_state WHERE fixture_id = $1", [fixtureId]);
    if (live?.status === "live") {
      return res.status(400).json({ success: false, message: "Cannot delete a live match." });
    }

    await query("DELETE FROM fixtures WHERE id = $1", [fixtureId]);
    return res.json({ success: true, message: "Friendly match deleted." });
  } catch (err) {
    console.error("[Friendlies] Failed to delete:", err);
    return res.status(500).json({ success: false, message: "Failed to delete friendly match." });
  }
});

export default router;
