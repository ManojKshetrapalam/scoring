import express from "express";
import { db, saveDatabase } from "../db.js";
import { broadcastScoreUpdate, broadcastCommentary } from "../socket.js";

const router = express.Router();

// GET all live matches
router.get("/live", (req, res) => {
  const liveMatches = Object.values(db.matchStates).filter(m => m.status === "live");
  return res.json({ success: true, data: liveMatches });
});

// GET specific match state
router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const match = db.matchStates[id] || db.matchStates[id.toString()];
  
  if (!match) {
    return res.status(404).json({ success: false, message: "Match details not found" });
  }

  // Safe guard fixture against undefined lookups
  const fixture = db.fixtures.find(f => f.id === id) || {
    id,
    tournament_id: 1,
    team1_id: 1,
    team2_id: 2,
    ground: "Gevents Stadium Arena A - Main Pitch",
    status: "live"
  };

  const team1Name = db.teams.find(t => t.id === fixture.team1_id)?.name || "Team 1";
  const team2Name = db.teams.find(t => t.id === fixture.team2_id)?.name || "Team 2";

  return res.json({
    success: true,
    data: {
      ...match,
      team1Name,
      team2Name,
      ground: fixture.ground,
      strikerName: db.players.find(p => p.id === match.striker_id)?.name || "Striker",
      nonStrikerName: db.players.find(p => p.id === match.non_striker_id)?.name || "Non-Striker",
      bowlerName: db.players.find(p => p.id === match.bowler_id)?.name || "Bowler"
    }
  });
});

// GET commentary feed for match
router.get("/:id/commentary", (req, res) => {
  const id = parseInt(req.params.id);
  const commentary = db.ballCommentaries.filter(c => c.match_id === id)
    .sort((a, b) => b.over_num - a.over_num || b.ball_num - a.ball_num); // reverse chronological
  return res.json({ success: true, data: commentary });
});

// POST ball-by-ball score update
router.post("/:id/score", (req, res) => {
  const matchId = parseInt(req.params.id);
  const { runs, extraRuns, extraType, wicketType, dismissedPlayerId, batsmanId, bowlerId } = req.body;

  const match = db.matchStates[matchId] || db.matchStates[matchId.toString()];
  if (!match) {
    return res.status(404).json({ success: false, message: "Live match not active." });
  }

  // Determine current batting team score reference
  const score = match.current_innings === 1 ? match.team1_score : match.team2_score;

  // Process extras vs runs
  if (extraType === "wide" || extraType === "noball") {
    score.runs += (runs || 0) + (extraRuns || 1);
    score.extras += (extraRuns || 1);
    // Wides & no-balls don't increment the legal ball count
  } else {
    score.runs += (runs || 0) + (extraRuns || 0);
    if (extraType === "bye" || extraType === "legbye") {
      score.extras += (extraRuns || 0);
    }

    // Increment balls
    match.current_ball += 1;
    if (match.current_ball >= 6) {
      match.current_over += 1;
      match.current_ball = 0;
    }
  }

  // Process wickets
  if (wicketType) {
    score.wickets += 1;
  }

  // Update over decimal presentation
  score.overs = parseFloat(`${match.current_over}.${match.current_ball}`);

  // Create ball-by-ball comment description
  const batsmanName = db.players.find(p => p.id === (batsmanId || match.striker_id))?.name || "Striker";
  const bowlerName = db.players.find(p => p.id === (bowlerId || match.bowler_id))?.name || "Bowler";
  let commentDesc = `${bowlerName} to ${batsmanName}: `;

  if (wicketType) {
    commentDesc += `OUT! Wicket falls via ${wicketType}.`;
  } else if (extraType) {
    commentDesc += `${runs || 0} run(s) plus ${extraType} (${extraRuns || 1} extra).`;
  } else {
    commentDesc += runs === 0 ? "No run." : runs === 4 ? "FOUR! Pierces the outfield!" : runs === 6 ? "SIX! Planted over the stands!" : `${runs} run(s).`;
  }

  // Push new commentary
  const commentObj = {
    match_id: matchId,
    innings: match.current_innings,
    over_num: match.current_over,
    ball_num: match.current_ball,
    batsman_id: batsmanId || match.striker_id,
    bowler_id: bowlerId || match.bowler_id,
    runs: runs || 0,
    extra_runs: extraRuns || 0,
    extra_type: extraType || null,
    wicket_type: wicketType || null,
    description: commentDesc
  };
  db.ballCommentaries.push(commentObj);

  // Broadcast through Socket.io for immediate presentation on browser pages & Flutter clients
  broadcastScoreUpdate(matchId, match);
  broadcastCommentary(matchId, commentObj);

  // Save database persistently to file
  saveDatabase();

  return res.json({
    success: true,
    message: "Score updated and broadcasted successfully.",
    matchState: match,
    newBall: commentObj
  });
});

// POST ball action alias specifically designed for Flutter Mobile alignment
router.post("/:id/ball", (req, res) => {
  const matchId = parseInt(req.params.id);
  const { runs, wicket, extras_type, batsman, bowler } = req.body;

  const match = db.matchStates[matchId] || db.matchStates[matchId.toString()];
  if (!match) {
    return res.status(404).json({ success: false, message: "Live match not active." });
  }

  const score = match.current_innings === 1 ? match.team1_score : match.team2_score;

  // Map incoming attributes
  const runVal = parseInt(runs) || 0;
  const isWkt = wicket === true;
  const extraVal = extras_type || null;
  const extraRuns = (extraVal === "wide" || extraVal === "noball") ? 1 : 0;

  // Process score changes
  if (extraVal === "wide" || extraVal === "noball") {
    score.runs += runVal + extraRuns;
    score.extras += extraRuns;
  } else {
    score.runs += runVal;
    if (extraVal === "bye" || extraVal === "legbye") {
      score.extras += runVal;
    }

    // Increment balls
    match.current_ball += 1;
    if (match.current_ball >= 6) {
      match.current_over += 1;
      match.current_ball = 0;
    }
  }

  const wicketType = isWkt ? "caught" : null;
  if (isWkt) {
    score.wickets += 1;
  }

  score.overs = parseFloat(`${match.current_over}.${match.current_ball}`);

  // Push commentary feed
  const batsmanName = batsman || db.players.find(p => p.id === match.striker_id)?.name || "Striker";
  const bowlerName = bowler || db.players.find(p => p.id === match.bowler_id)?.name || "Bowler";
  let commentDesc = `${bowlerName} to ${batsmanName}: `;

  if (isWkt) {
    commentDesc += "OUT! Wicket falls!";
  } else if (extraVal) {
    commentDesc += `${runVal} run(s) via ${extraVal}.`;
  } else {
    commentDesc += runVal === 0 ? "No run." : runVal === 4 ? "FOUR!" : runVal === 6 ? "SIX!" : `${runVal} run(s).`;
  }

  const commentObj = {
    match_id: matchId,
    innings: match.current_innings,
    over_num: match.current_over,
    ball_num: match.current_ball,
    batsman_id: match.striker_id,
    bowler_id: match.bowler_id,
    runs: runVal,
    extra_runs: extraRuns,
    extra_type: extraVal,
    wicket_type: wicketType,
    description: commentDesc
  };
  db.ballCommentaries.push(commentObj);

  broadcastScoreUpdate(matchId, match);
  broadcastCommentary(matchId, commentObj);

  // Save database persistently to file
  saveDatabase();

  return res.json({
    success: true,
    message: "Score updated and broadcasted successfully.",
    matchState: match,
    newBall: commentObj
  });
});

// UNDO last delivery action
router.post("/:id/undo", (req, res) => {
  const matchId = parseInt(req.params.id);
  const match = db.matchStates[matchId] || db.matchStates[matchId.toString()];
  if (!match) {
    return res.status(404).json({ success: false, message: "Match state not found." });
  }

  // Pop last commentary element
  const lastIndex = db.ballCommentaries.map(c => c.match_id).lastIndexOf(matchId);
  if (lastIndex === -1) {
    return res.status(400).json({ success: false, message: "No score actions to undo." });
  }

  const undoneBall = db.ballCommentaries.splice(lastIndex, 1)[0];
  const score = match.current_innings === 1 ? match.team1_score : match.team2_score;

  // Reverse runs and extras
  if (undoneBall.extra_type === "wide" || undoneBall.extra_type === "noball") {
    score.runs -= (undoneBall.runs + (undoneBall.extra_runs || 1));
    score.extras -= (undoneBall.extra_runs || 1);
  } else {
    score.runs -= (undoneBall.runs + undoneBall.extra_runs);
    if (undoneBall.extra_type === "bye" || undoneBall.extra_type === "legbye") {
      score.extras -= undoneBall.extra_runs;
    }

    // Decrement ball
    if (match.current_ball === 0) {
      match.current_over -= 1;
      match.current_ball = 5;
    } else {
      match.current_ball -= 1;
    }
  }

  if (undoneBall.wicket_type) {
    score.wickets -= 1;
  }

  score.overs = parseFloat(`${match.current_over}.${match.current_ball}`);

  broadcastScoreUpdate(matchId, match);

  // Save database persistently to file
  saveDatabase();

  return res.json({
    success: true,
    message: "Undone last ball action.",
    matchState: match
  });
});

export default router;
