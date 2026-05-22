import express from "express";
import { query } from "../db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const teams = await query(
      `
        SELECT
          t.id,
          t.name,
          t.company_name,
          t.logo_url,
          t.jersey_color,
          t.status,
          t.payment_status,
          t.tournament_id,
          t.created_at,
          tr.name AS tournament_name,
          COUNT(p.id)::int AS player_count
        FROM teams t
        LEFT JOIN tournaments tr ON tr.id = t.tournament_id
        LEFT JOIN players p ON p.team_id = t.id
        GROUP BY t.id, tr.name
        ORDER BY t.created_at DESC, t.id DESC
      `,
    );

    return res.json({ success: true, data: teams });
  } catch (err) {
    console.error("[Teams] Failed to list teams:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch teams." });
  }
});

export default router;
