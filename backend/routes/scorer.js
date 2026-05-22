import express from "express";
import { query } from "../db.js";
import { authenticateToken, requireRole } from "./auth.js";

const router = express.Router();

router.get("/workspace", authenticateToken, requireRole("scorer", "super_admin"), async (req, res) => {
  try {
    const tournaments = await query(
      `
        SELECT
          t.*,
          COUNT(DISTINCT f.id)::int AS fixture_count,
          COUNT(DISTINCT tm.id)::int AS team_count
        FROM tournaments t
        LEFT JOIN fixtures f ON f.tournament_id = t.id
        LEFT JOIN teams tm ON tm.tournament_id = t.id
        GROUP BY t.id
        ORDER BY t.created_at DESC, t.id DESC
      `,
    );

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

    const tournamentFixtures = await query(
      `
        SELECT
          f.*,
          t.name AS tournament_name,
          team1.name AS team1_name,
          team2.name AS team2_name,
          ms.status AS live_status
        FROM fixtures f
        INNER JOIN tournaments t ON t.id = f.tournament_id
        LEFT JOIN teams team1 ON team1.id = f.team1_id
        LEFT JOIN teams team2 ON team2.id = f.team2_id
        LEFT JOIN match_state ms ON ms.fixture_id = f.id
        ORDER BY f.match_date DESC, f.id DESC
        LIMIT 100
      `,
    );

    return res.json({
      success: true,
      data: { tournaments, friendlies, tournamentFixtures },
    });
  } catch (err) {
    console.error("[Scorer] Failed to load workspace:", err);
    return res.status(500).json({ success: false, message: "Failed to load scorer workspace." });
  }
});

export default router;
