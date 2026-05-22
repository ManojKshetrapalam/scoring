import express from "express";
import { db } from "../db.js";

const router = express.Router();

// GET all tournaments
router.get("/", (req, res) => {
  return res.json({ success: true, data: db.tournaments });
});

// GET tournament by ID
router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const tournament = db.tournaments.find(t => t.id === id);
  if (!tournament) {
    return res.status(404).json({ success: false, message: "Tournament not found" });
  }
  return res.json({ success: true, data: tournament });
});

// GET teams registered for a tournament
router.get("/:id/teams", (req, res) => {
  const id = parseInt(req.params.id);
  const teams = db.teams.filter(t => t.tournament_id === id);
  return res.json({ success: true, data: teams });
});

// GET fixtures for a tournament
router.get("/:id/fixtures", (req, res) => {
  const id = parseInt(req.params.id);
  const fixtures = db.fixtures.filter(f => f.tournament_id === id);
  return res.json({ success: true, data: fixtures });
});

// REGISTER a new team
router.post("/:id/register", (req, res) => {
  const tournamentId = parseInt(req.params.id);
  const { teamName, companyName, managerName, mobileNumber, email, jerseyColor, playerCount } = req.body;

  if (!teamName || !companyName || !managerName || !email) {
    return res.status(400).json({ success: false, message: "Required fields are missing." });
  }

  // Create team entry
  const newTeam = {
    id: db.teams.length + 1,
    tournament_id: tournamentId,
    name: teamName,
    company_name: companyName,
    logo_url: "https://geventsunlimited.com/frontend/images/select/images/geventslogo.svg",
    jersey_color: jerseyColor || "Neon Green",
    status: "pending",
    payment_status: "paid", // Razorpay UPI mock payment successful
    payment_id: "pay_mock_" + Math.random().toString(36).substr(2, 9),
    created_at: new Date().toISOString()
  };

  db.teams.push(newTeam);

  console.log(`[SMTP MOCK ALERT] Auto registration email sent to: ${email} for team ${teamName}`);

  return res.json({
    success: true,
    message: "Team registered successfully! Payment approved.",
    team: newTeam
  });
});

// GET tournament standings (points table + leaderboards)
router.get("/:id/standings", (req, res) => {
  const id = parseInt(req.params.id);
  const tournament = db.tournaments.find(t => t.id === id);
  if (!tournament) {
    return res.status(404).json({ success: false, message: "Tournament not found" });
  }

  // Generate dynamic Points Table based on seeded teams and matches results
  const teams = db.teams.filter(t => t.tournament_id === id && t.status === "approved");
  const pointsTable = teams.map((team, idx) => {
    // Generate some standard realistic sports points values
    const played = 4;
    const won = idx === 0 ? 3 : idx === 1 ? 2 : 1;
    const lost = played - won;
    const points = won * 2;
    const nrr = (idx === 0 ? 1.45 : idx === 1 ? 0.32 : -0.84).toFixed(3);

    return {
      teamId: team.id,
      teamName: team.name,
      played,
      won,
      lost,
      noResult: 0,
      nrr,
      points
    };
  }).sort((a, b) => b.points - a.points || b.nrr - a.nrr);

  // Generate Orange / Purple Cap Leaderboards
  const orangeCap = [
    { name: "Virat Kohli", team: "Google Giants", runs: 342, matches: 4, strikeRate: 148.5 },
    { name: "Joe Root", team: "Microsoft Mavericks", runs: 284, matches: 4, strikeRate: 122.3 },
    { name: "Rohit Sharma", team: "Google Giants", runs: 210, matches: 4, strikeRate: 165.2 }
  ];

  const purpleCap = [
    { name: "Mitchell Starc", team: "Microsoft Mavericks", wickets: 11, matches: 4, economy: 6.8 },
    { name: "Jasprit Bumrah", team: "Google Giants", wickets: 9, matches: 4, economy: 5.4 },
    { name: "Ravindra Jadeja", team: "Google Giants", wickets: 6, matches: 4, economy: 7.2 }
  ];

  return res.json({
    success: true,
    pointsTable,
    orangeCap,
    purpleCap
  });
});

export default router;
