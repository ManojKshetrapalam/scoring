// Dual-mode In-Memory & Relational Database Layer for Gevents Unlimited Cricket
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, "db.json");

export const db = {
  users: [],
  tournaments: [],
  teams: [],
  players: [],
  fixtures: [],
  matchStates: {}, // keyed by fixture_id
  ballCommentaries: []
};

// Helper to save the database state to a JSON file
export function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), "utf8");
    console.log(`[DB] Database successfully saved to: ${DB_FILE_PATH}`);
  } catch (err) {
    console.error("[DB] Failed to save database to file:", err);
  }
}

// Helper to load the database state from a JSON file
export function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      console.log(`[DB] Loading database from file: ${DB_FILE_PATH}`);
      const fileData = fs.readFileSync(DB_FILE_PATH, "utf8");
      const parsedData = JSON.parse(fileData);
      
      db.users = parsedData.users || [];
      db.tournaments = parsedData.tournaments || [];
      db.teams = parsedData.teams || [];
      db.players = parsedData.players || [];
      db.fixtures = parsedData.fixtures || [];
      db.matchStates = parsedData.matchStates || {};
      db.ballCommentaries = parsedData.ballCommentaries || [];
      
      console.log("[DB] Database loaded successfully from disk.");
    } else {
      console.log("[DB] No existing database file found. Seeding initial database...");
      seedDatabase();
      saveDatabase();
    }
  } catch (err) {
    console.error("[DB] Failed to load database from file, falling back to seeding:", err);
    seedDatabase();
  }
}

// Initial static seed helper
export function seedDatabase() {
  console.log("Seeding in-memory database for Gevents Cricket...");

  // 1. Seed Users (Super Admins, Team Managers, Scorers, Players)
  db.users.push(
    { id: 1, email: "admin@gevents.com", name: "Super Admin", role: "super_admin", passwordHash: "$2a$10$U7vFzB.p2M7eQ2e5b8B7beP2qG6hI8Tq0Jv.iL.8r5.y09fW.F7gq" }, // password: admin123
    { id: 2, email: "manager1@google.com", name: "John Doe", role: "team_manager", passwordHash: "$2a$10$U7vFzB.p2M7eQ2e5b8B7beP2qG6hI8Tq0Jv.iL.8r5.y09fW.F7gq" },
    { id: 3, email: "scorer@gevents.com", name: "Jane Scorer", role: "scorer", passwordHash: "$2a$10$U7vFzB.p2M7eQ2e5b8B7beP2qG6hI8Tq0Jv.iL.8r5.y09fW.F7gq" }
  );

  // 2. Seed Tournaments
  db.tournaments.push(
    {
      id: 1,
      name: "Gevents Corporate Cricket Cup 2026",
      type: "leather_ball",
      status: "active",
      prize_money: 100000,
      venue_details: { ground_name: "Gevents Stadium Arena A", address: "Kharadi, Pune" },
      rules: { overs: 20, players_per_team: 11, powerplay_overs: 6, free_hit: true, wide_value: 1, noball_value: 1 }
    },
    {
      id: 2,
      name: "Baner Corporate Turf Box League",
      type: "turf_cricket",
      status: "active",
      prize_money: 50000,
      venue_details: { ground_name: "Gevents Turf Park B", address: "Baner, Pune" },
      rules: { overs: 8, players_per_team: 8, powerplay_overs: 2, free_hit: false, wide_value: 2, noball_value: 2 }
    }
  );

  // 3. Seed Teams for Tournament 1 (Leather Ball)
  db.teams.push(
    { id: 1, tournament_id: 1, name: "Google Giants", company_name: "Google Inc.", logo_url: "https://geventsunlimited.com/frontend/images/select/images/geventslogo.svg", jersey_color: "Navy Blue / Yellow", manager_id: 2, status: "approved", payment_status: "paid" },
    { id: 2, tournament_id: 1, name: "Microsoft Mavericks", company_name: "Microsoft Corp.", logo_url: "https://geventsunlimited.com/frontend/images/select/images/geventslogo.svg", jersey_color: "Teal / White", manager_id: null, status: "approved", payment_status: "paid" },
    { id: 3, tournament_id: 1, name: "Meta Masters", company_name: "Meta Platforms", logo_url: "https://geventsunlimited.com/frontend/images/select/images/geventslogo.svg", jersey_color: "Royal Blue / Silver", manager_id: null, status: "approved", payment_status: "paid" },
    { id: 4, tournament_id: 1, name: "Amazon Aces", company_name: "Amazon Retail", logo_url: "https://geventsunlimited.com/frontend/images/select/images/geventslogo.svg", jersey_color: "Orange / Black", manager_id: null, status: "pending", payment_status: "pending" }
  );

  // Seed Teams for Tournament 2 (Box Cricket)
  db.teams.push(
    { id: 5, tournament_id: 2, name: "Netflix Ninjas", company_name: "Netflix Inc.", logo_url: "https://geventsunlimited.com/frontend/images/select/images/geventslogo.svg", jersey_color: "Black / Red", manager_id: null, status: "approved", payment_status: "paid" },
    { id: 6, tournament_id: 2, name: "Adobe Avengers", company_name: "Adobe Systems", logo_url: "https://geventsunlimited.com/frontend/images/select/images/geventslogo.svg", jersey_color: "Crimson Red", manager_id: null, status: "approved", payment_status: "paid" }
  );

  // 4. Seed Players for Google Giants (Team 1) and Microsoft Mavericks (Team 2)
  const giantsPlayers = [
    { id: 101, team_id: 1, name: "Virat Kohli", jersey_number: 18, batting_style: "Right-hand bat", bowling_style: "Right-arm medium", is_captain: true, is_vice_captain: false },
    { id: 102, team_id: 1, name: "Rohit Sharma", jersey_number: 45, batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", is_captain: false, is_vice_captain: true },
    { id: 103, team_id: 1, name: "KL Rahul", jersey_number: 1, batting_style: "Right-hand bat", bowling_style: "None", is_captain: false, is_vice_captain: false },
    { id: 104, team_id: 1, name: "Hardik Pandya", jersey_number: 33, batting_style: "Right-hand bat", bowling_style: "Right-arm fast-medium", is_captain: false, is_vice_captain: false },
    { id: 105, team_id: 1, name: "Ravindra Jadeja", jersey_number: 8, batting_style: "Left-hand bat", bowling_style: "Slow left-arm orthodox", is_captain: false, is_vice_captain: false },
    { id: 106, team_id: 1, name: "Jasprit Bumrah", jersey_number: 93, batting_style: "Right-hand bat", bowling_style: "Right-arm fast", is_captain: false, is_vice_captain: false },
    { id: 107, team_id: 1, name: "Mohammed Shami", jersey_number: 11, batting_style: "Right-hand bat", bowling_style: "Right-arm fast", is_captain: false, is_vice_captain: false }
  ];
  db.players.push(...giantsPlayers);

  const mavericksPlayers = [
    { id: 201, team_id: 2, name: "Kane Williamson", jersey_number: 22, batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", is_captain: true, is_vice_captain: false },
    { id: 202, team_id: 2, name: "Steve Smith", jersey_number: 49, batting_style: "Right-hand bat", bowling_style: "Right-arm legbreak", is_captain: false, is_vice_captain: true },
    { id: 203, team_id: 2, name: "Joe Root", jersey_number: 66, batting_style: "Right-hand bat", bowling_style: "Right-arm offbreak", is_captain: false, is_vice_captain: false },
    { id: 204, team_id: 2, name: "Ben Stokes", jersey_number: 55, batting_style: "Left-hand bat", bowling_style: "Right-arm fast-medium", is_captain: false, is_vice_captain: false },
    { id: 205, team_id: 2, name: "Mitchell Starc", jersey_number: 56, batting_style: "Left-hand bat", bowling_style: "Left-arm fast", is_captain: false, is_vice_captain: false },
    { id: 206, team_id: 2, name: "Pat Cummins", jersey_number: 30, batting_style: "Right-hand bat", bowling_style: "Right-arm fast", is_captain: false, is_vice_captain: false },
    { id: 207, team_id: 2, name: "Trent Boult", jersey_number: 18, batting_style: "Right-hand bat", bowling_style: "Left-arm fast-medium", is_captain: false, is_vice_captain: false }
  ];
  db.players.push(...mavericksPlayers);

  // 5. Seed Fixtures (Matches Scheduled & Live)
  db.fixtures.push(
    {
      id: 1,
      tournament_id: 1,
      team1_id: 1,
      team2_id: 2,
      match_date: new Date(Date.now() - 3600000).toISOString(), // Started 1 hour ago
      ground: "Gevents Stadium Arena A - Main Pitch",
      scorer_id: 3,
      status: "live",
      result_summary: null
    },
    {
      id: 2,
      tournament_id: 1,
      team1_id: 3,
      team2_id: 2,
      match_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      ground: "Gevents Stadium Arena A - Pitch B",
      scorer_id: 3,
      status: "scheduled",
      result_summary: null
    },
    {
      id: 3,
      tournament_id: 2,
      team1_id: 5,
      team2_id: 6,
      match_date: new Date(Date.now() + 172800000).toISOString(), // In 2 days
      ground: "Baner Turf - Court 1",
      scorer_id: null,
      status: "scheduled",
      result_summary: null
    }
  );

  // 6. Seed Live Match State (for Fixture 1)
  db.matchStates[1] = {
    id: 1,
    fixture_id: 1,
    current_innings: 1,
    current_over: 14,
    current_ball: 2,
    striker_id: 101, // Virat Kohli
    non_striker_id: 102, // Rohit Sharma
    bowler_id: 205, // Mitchell Starc
    team1_score: {
      runs: 122,
      wickets: 4,
      overs: 14.2,
      extras: 8
    },
    team2_score: {
      runs: 0,
      wickets: 0,
      overs: 0.0,
      extras: 0
    },
    status: "live"
  };

  // 7. Seed Ball-by-Ball Commentary for Match 1
  db.ballCommentaries.push(
    { match_id: 1, innings: 1, over_num: 14, ball_num: 1, batsman_id: 101, bowler_id: 205, runs: 4, extra_runs: 0, extra_type: null, wicket_type: null, description: "Starc to Kohli, FOUR! Beautifully driven through extra cover." },
    { match_id: 1, innings: 1, over_num: 14, ball_num: 2, batsman_id: 101, bowler_id: 205, runs: 1, extra_runs: 0, extra_type: null, wicket_type: null, description: "Starc to Kohli, 1 run, pushed down to long-on for a quick single." }
  );
}

// Load database state at server startup
loadDatabase();
