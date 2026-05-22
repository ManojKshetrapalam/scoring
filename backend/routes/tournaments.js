import express from "express";
import { normalizeRole, query, queryOne, withTransaction } from "../db.js";
import { authenticateToken, requireRole } from "./auth.js";
import { createInitialLiveData, createLineupPayload } from "../scoring.js";

const router = express.Router();

function parseVenueDetails(payload = {}) {
  return {
    ground_name: payload.groundName || payload.ground_name || "",
    address: payload.address || "",
  };
}

function parseRules(payload = {}) {
  return {
    overs: Number(payload.overs || 20),
    players_per_team: Number(payload.playersPerTeam || payload.players_per_team || 11),
    powerplay_overs: Number(payload.powerplayOvers || payload.powerplay_overs || 0),
    free_hit: payload.freeHit ?? true,
    wide_value: Number(payload.wideValue || payload.wide_value || 1),
    noball_value: Number(payload.noBallValue || payload.noball_value || 1),
  };
}

function sanitizePlayers(players = []) {
  if (!Array.isArray(players) || players.length === 0) {
    throw new Error("Each team must include at least one player.");
  }

  let captainAssigned = false;
  let wicketKeeperAssigned = false;

  return players.map((player, index) => {
    const normalized = {
      id: player.id ? Number(player.id) : null,
      name: String(player.name || "").trim(),
      jerseyNumber: player.jerseyNumber ?? player.jersey_number ?? null,
      battingStyle: player.battingStyle || player.batting_style || null,
      bowlingStyle: player.bowlingStyle || player.bowling_style || null,
      isCaptain: Boolean(player.isCaptain || player.is_captain),
      isViceCaptain: Boolean(player.isViceCaptain || player.is_vice_captain),
      isWicketKeeper: Boolean(player.isWicketKeeper || player.is_wicket_keeper),
    };

    if (!normalized.name) {
      throw new Error(`Player ${index + 1} is missing a name.`);
    }

    if (normalized.isCaptain && !captainAssigned) {
      captainAssigned = true;
    } else if (normalized.isCaptain) {
      normalized.isCaptain = false;
    }

    if (normalized.isWicketKeeper && !wicketKeeperAssigned) {
      wicketKeeperAssigned = true;
    } else if (normalized.isWicketKeeper) {
      normalized.isWicketKeeper = false;
    }

    return normalized;
  }).map((player, index, list) => {
    if (!captainAssigned && index === 0) {
      player.isCaptain = true;
      captainAssigned = true;
    }
    if (!wicketKeeperAssigned && index === 0) {
      player.isWicketKeeper = true;
      wicketKeeperAssigned = true;
    }
    return player;
  });
}

async function upsertTeamWithPlayers(client, tournamentId, teamPayload, defaultPlayersPerTeam) {
  if (!teamPayload?.name && !teamPayload?.id) {
    throw new Error("Each fixture team must have either an id or a name.");
  }

  let team;
  if (teamPayload.id) {
    const teamRes = await client.query(
      "SELECT * FROM teams WHERE id = $1 AND tournament_id = $2 LIMIT 1",
      [Number(teamPayload.id), tournamentId],
    );
    team = teamRes.rows[0];
  } else {
    const existingRes = await client.query(
      "SELECT * FROM teams WHERE tournament_id = $1 AND name = $2 LIMIT 1",
      [tournamentId, teamPayload.name],
    );
    team = existingRes.rows[0];
  }

  if (!team) {
    const insertRes = await client.query(
      `
        INSERT INTO teams (
          tournament_id, name, company_name, jersey_color, logo_url, status, payment_status
        )
        VALUES ($1, $2, $3, $4, $5, 'approved', 'paid')
        RETURNING *
      `,
      [
        tournamentId,
        teamPayload.name,
        teamPayload.companyName || teamPayload.company_name || teamPayload.name,
        teamPayload.jerseyColor || teamPayload.jersey_color || null,
        teamPayload.logoUrl || teamPayload.logo_url || null,
      ],
    );
    team = insertRes.rows[0];
  } else {
    const updateRes = await client.query(
      `
        UPDATE teams
        SET
          company_name = COALESCE($2, company_name),
          jersey_color = COALESCE($3, jersey_color),
          logo_url = COALESCE($4, logo_url),
          status = 'approved',
          payment_status = 'paid'
        WHERE id = $1
        RETURNING *
      `,
      [
        team.id,
        teamPayload.companyName || teamPayload.company_name || null,
        teamPayload.jerseyColor || teamPayload.jersey_color || null,
        teamPayload.logoUrl || teamPayload.logo_url || null,
      ],
    );
    team = updateRes.rows[0];
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

function ballsToOvers(legalBalls) {
  if (!legalBalls) return 0;
  return legalBalls / 6;
}

function buildStandingsFromMatches(teams, matchStates) {
  const table = new Map();
  const teamNameMap = new Map(teams.map((team) => [team.id, team.name]));
  teams.forEach((team) => {
    table.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      played: 0,
      won: 0,
      lost: 0,
      noResult: 0,
      runsFor: 0,
      ballsFaced: 0,
      runsAgainst: 0,
      ballsBowled: 0,
      points: 0,
      nrr: "0.000",
    });
  });

  const battingLeaders = new Map();
  const bowlingLeaders = new Map();

  for (const row of matchStates) {
    const liveData = row.live_data || {};
    const inningsCollection = Object.values(liveData.innings || {});

    for (const inningsState of inningsCollection) {
      if (!inningsState?.battingTeamId || !inningsState?.bowlingTeamId) continue;

      const battingRow = table.get(inningsState.battingTeamId);
      const bowlingRow = table.get(inningsState.bowlingTeamId);

      if (battingRow) {
        battingRow.runsFor += inningsState.runs || 0;
        battingRow.ballsFaced += inningsState.legalBalls || 0;
      }

      if (bowlingRow) {
        bowlingRow.runsAgainst += inningsState.runs || 0;
        bowlingRow.ballsBowled += inningsState.legalBalls || 0;
      }

      for (const batter of Object.values(inningsState.batsmen || {})) {
        const existing = battingLeaders.get(batter.playerId) || {
          playerId: batter.playerId,
          name: batter.name,
          teamId: inningsState.battingTeamId,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          matches: 0,
        };

        existing.runs += batter.runs || 0;
        existing.balls += batter.balls || 0;
        existing.fours += batter.fours || 0;
        existing.sixes += batter.sixes || 0;
        if ((batter.balls || 0) > 0 || (batter.runs || 0) > 0 || batter.status === "out") {
          existing.matches += 1;
        }
        battingLeaders.set(batter.playerId, existing);
      }

      for (const bowler of Object.values(inningsState.bowlers || {})) {
        const existing = bowlingLeaders.get(bowler.playerId) || {
          playerId: bowler.playerId,
          name: bowler.name,
          teamId: inningsState.bowlingTeamId,
          wickets: 0,
          runs: 0,
          legalBalls: 0,
          matches: 0,
        };

        existing.wickets += bowler.wickets || 0;
        existing.runs += bowler.runs || 0;
        existing.legalBalls += bowler.legalBalls || 0;
        if ((bowler.legalBalls || 0) > 0 || (bowler.runs || 0) > 0 || (bowler.wickets || 0) > 0) {
          existing.matches += 1;
        }
        bowlingLeaders.set(bowler.playerId, existing);
      }
    }

    if (row.status === "completed" && row.live_data?.result) {
      const fixtureTeams = [row.team1_id, row.team2_id];
      fixtureTeams.forEach((teamId) => {
        const standing = table.get(teamId);
        if (standing) {
          standing.played += 1;
        }
      });

      const winnerTeamId = row.live_data.result.winnerTeamId;
      if (winnerTeamId && table.has(winnerTeamId)) {
        const winner = table.get(winnerTeamId);
        winner.won += 1;
        winner.points += 2;

        fixtureTeams
          .filter((teamId) => teamId !== winnerTeamId)
          .forEach((teamId) => {
            const loser = table.get(teamId);
            if (loser) loser.lost += 1;
          });
      } else {
        fixtureTeams.forEach((teamId) => {
          const noResultTeam = table.get(teamId);
          if (noResultTeam) {
            noResultTeam.noResult += 1;
            noResultTeam.points += 1;
          }
        });
      }
    }
  }

  const pointsTable = [...table.values()]
    .map((row) => {
      const forRate = row.ballsFaced ? row.runsFor / ballsToOvers(row.ballsFaced) : 0;
      const againstRate = row.ballsBowled ? row.runsAgainst / ballsToOvers(row.ballsBowled) : 0;
      return {
        ...row,
        nrr: (forRate - againstRate).toFixed(3),
      };
    })
    .sort((left, right) => right.points - left.points || Number(right.nrr) - Number(left.nrr));

  return {
    pointsTable,
    orangeCap: [...battingLeaders.values()]
      .sort((left, right) => right.runs - left.runs || left.balls - right.balls)
      .slice(0, 10)
      .map((item) => ({
        ...item,
        team: teamNameMap.get(item.teamId) || `Team ${item.teamId}`,
        strikeRate: item.balls ? Number(((item.runs / item.balls) * 100).toFixed(2)) : 0,
        match: item.matches,
      })),
    purpleCap: [...bowlingLeaders.values()]
      .sort((left, right) => right.wickets - left.wickets || left.runs - right.runs)
      .slice(0, 10)
      .map((item) => ({
        ...item,
        team: teamNameMap.get(item.teamId) || `Team ${item.teamId}`,
        economy: item.legalBalls ? Number(((item.runs * 6) / item.legalBalls).toFixed(2)) : 0,
        match: item.matches,
      })),
  };
}

router.post("/", authenticateToken, requireRole("scorer", "super_admin"), async (req, res) => {
  try {
    const { name, type, prizeMoney, startDate, endDate } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, message: "Tournament name and type are required." });
    }

    const tournament = await queryOne(
      `
        INSERT INTO tournaments (
          name, type, rules, prize_money, venue_details, status, start_date, end_date
        )
        VALUES ($1, $2::tournament_type, $3::jsonb, $4, $5::jsonb, 'draft', $6, $7)
        RETURNING *
      `,
      [
        name,
        type,
        JSON.stringify(parseRules(req.body)),
        Number(prizeMoney || 0),
        JSON.stringify(parseVenueDetails(req.body)),
        startDate || null,
        endDate || null,
      ],
    );

    return res.status(201).json({
      success: true,
      message: "Tournament created successfully.",
      data: tournament,
    });
  } catch (err) {
    console.error("[Tournaments] Failed to create tournament:", err);
    return res.status(500).json({ success: false, message: "Failed to create tournament." });
  }
});

router.get("/", async (req, res) => {
  try {
    const tournaments = await query(
      "SELECT * FROM tournaments ORDER BY created_at DESC, id DESC",
    );
    return res.json({ success: true, data: tournaments });
  } catch (err) {
    console.error("[Tournaments] Failed to list tournaments:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch tournaments." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const tournament = await queryOne("SELECT * FROM tournaments WHERE id = $1", [id]);

    if (!tournament) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    return res.json({ success: true, data: tournament });
  } catch (err) {
    console.error("[Tournaments] Failed to fetch tournament:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch tournament." });
  }
});

router.get("/:id/teams", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const teams = await query(
      `
        SELECT
          t.*,
          COUNT(p.id)::int AS player_count
        FROM teams t
        LEFT JOIN players p ON p.team_id = t.id
        WHERE t.tournament_id = $1
        GROUP BY t.id
        ORDER BY t.created_at DESC, t.id DESC
      `,
      [id],
    );
    return res.json({ success: true, data: teams });
  } catch (err) {
    console.error("[Tournaments] Failed to fetch teams:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch teams." });
  }
});

router.get("/:id/fixtures", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const fixtures = await query(
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
        WHERE f.tournament_id = $1
        ORDER BY f.match_date ASC, f.id ASC
      `,
      [id],
    );
    return res.json({ success: true, data: fixtures });
  } catch (err) {
    console.error("[Tournaments] Failed to fetch fixtures:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch fixtures." });
  }
});

router.post("/:id/register", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id, 10);
    const { teamName, companyName, managerName, mobileNumber, email, jerseyColor } = req.body;

    if (!teamName || !companyName || !managerName || !email) {
      return res.status(400).json({ success: false, message: "Required fields are missing." });
    }

    const team = await withTransaction(async (client) => {
      const tournamentRes = await client.query(
        "SELECT id FROM tournaments WHERE id = $1",
        [tournamentId],
      );
      if (tournamentRes.rowCount === 0) {
        throw new Error("TOURNAMENT_NOT_FOUND");
      }

      let managerRes = await client.query(
        "SELECT id FROM users WHERE email = $1 OR phone = $2 LIMIT 1",
        [email, mobileNumber || null],
      );

      if (managerRes.rowCount === 0) {
        managerRes = await client.query(
          `
            INSERT INTO users (email, phone, name, password_hash, role)
            VALUES ($1, $2, $3, '', $4::user_role)
            RETURNING id
          `,
          [email, mobileNumber || null, managerName, normalizeRole("team_manager")],
        );
      }

      const insertRes = await client.query(
        `
          INSERT INTO teams (
            tournament_id, name, company_name, logo_url, jersey_color,
            manager_id, status, payment_status, payment_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'paid', $7)
          RETURNING *
        `,
        [
          tournamentId,
          teamName,
          companyName,
          "https://geventsunlimited.com/frontend/images/select/images/geventslogo.svg",
          jerseyColor || "Neon Green",
          managerRes.rows[0].id,
          `pay_${Date.now()}`,
        ],
      );

      return insertRes.rows[0];
    });

    return res.json({
      success: true,
      message: "Team registered successfully.",
      team,
    });
  } catch (err) {
    if (err.message === "TOURNAMENT_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }
    console.error("[Tournaments] Failed to register team:", err);
    return res.status(500).json({ success: false, message: "Failed to register team." });
  }
});

router.post("/:id/fixtures", authenticateToken, requireRole("scorer", "super_admin"), async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id, 10);
    const { matchDate, ground, team1, team2 } = req.body;

    if (!matchDate || !ground || !team1 || !team2) {
      return res.status(400).json({ success: false, message: "Match date, ground, team A, and team B are required." });
    }

    const payload = await withTransaction(async (client) => {
      const tournamentRes = await client.query(
        "SELECT * FROM tournaments WHERE id = $1 LIMIT 1",
        [tournamentId],
      );

      if (tournamentRes.rowCount === 0) {
        throw new Error("TOURNAMENT_NOT_FOUND");
      }

      const tournament = tournamentRes.rows[0];
      const defaultPlayersPerTeam = Number(tournament.rules?.players_per_team || 11);
      const oversLimit = Number(tournament.rules?.overs || 20);

      const team1State = await upsertTeamWithPlayers(client, tournamentId, team1, defaultPlayersPerTeam);
      const team2State = await upsertTeamWithPlayers(client, tournamentId, team2, defaultPlayersPerTeam);

      if (team1State.team.id === team2State.team.id) {
        throw new Error("A fixture must have two different teams.");
      }

      const fixtureRes = await client.query(
        `
          INSERT INTO fixtures (
            tournament_id, team1_id, team2_id, match_date, ground, scorer_id, status
          )
          VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
          RETURNING *
        `,
        [
          tournamentId,
          team1State.team.id,
          team2State.team.id,
          matchDate,
          ground,
          req.user.userId,
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
          JSON.stringify({
            runs: 0,
            wickets: 0,
            overs: 0,
            extras: 0,
            wides: 0,
            noBalls: 0,
            byes: 0,
            legByes: 0,
            runRate: 0,
          }),
          JSON.stringify({
            runs: 0,
            wickets: 0,
            overs: 0,
            extras: 0,
            wides: 0,
            noBalls: 0,
            byes: 0,
            legByes: 0,
            runRate: 0,
          }),
          JSON.stringify(liveData),
        ],
      );

      return {
        tournament,
        fixture: fixtureRes.rows[0],
        matchState: matchStateRes.rows[0],
        teams: [team1State, team2State],
      };
    });

    return res.status(201).json({
      success: true,
      message: "Fixture scheduled successfully.",
      data: payload,
    });
  } catch (err) {
    if (err.message === "TOURNAMENT_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }
    console.error("[Tournaments] Failed to schedule fixture:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to schedule fixture." });
  }
});

router.get("/:id/standings", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const tournament = await queryOne("SELECT id FROM tournaments WHERE id = $1", [id]);

    if (!tournament) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    const teams = await query(
      "SELECT id, name FROM teams WHERE tournament_id = $1 ORDER BY id ASC",
      [id],
    );

    const matchStates = await query(
      `
        SELECT
          ms.*,
          f.team1_id,
          f.team2_id
        FROM match_state ms
        INNER JOIN fixtures f ON f.id = ms.fixture_id
        WHERE f.tournament_id = $1
      `,
      [id],
    );

    const standings = buildStandingsFromMatches(teams, matchStates);

    return res.json({
      success: true,
      ...standings,
    });
  } catch (err) {
    console.error("[Tournaments] Failed to fetch standings:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch standings." });
  }
});

export default router;
