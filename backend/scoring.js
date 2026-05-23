const CREDITED_WICKETS = new Set(["bowled", "caught", "lbw", "stumped", "hit_wicket"]);
const WIDE_ALLOWED_WICKETS = new Set(["runout", "stumped", "retired_out"]);
const NO_BALL_ALLOWED_WICKETS = new Set(["runout", "retired_out"]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ballsToOverValue(legalBalls = 0) {
  return Number(`${Math.floor(legalBalls / 6)}.${legalBalls % 6}`);
}

function strikeRate(runs = 0, balls = 0) {
  if (!balls) return 0;
  return Number(((runs / balls) * 100).toFixed(2));
}

function economy(runs = 0, legalBalls = 0) {
  if (!legalBalls) return 0;
  return Number(((runs * 6) / legalBalls).toFixed(2));
}

function lineupKeyForTeam(liveData, teamId) {
  const id = Number(teamId);
  if (Number(liveData.lineups.team1?.teamId) === id) {
    return "team1";
  }
  if (Number(liveData.lineups.team2?.teamId) === id) {
    return "team2";
  }
  return null;
}

function lineupForTeam(liveData, teamId) {
  const key = lineupKeyForTeam(liveData, teamId);
  return key ? liveData.lineups[key] : null;
}

function playerSummary(liveData, playerId) {
  const allPlayers = [
    ...(liveData.lineups.team1?.players || []),
    ...(liveData.lineups.team2?.players || []),
  ];

  return allPlayers.find((player) => player.id === playerId) || null;
}

function nextAvailableBatter(inningsState, battingOrder, nextBatterId = null) {
  const seenIds = new Set(
    Object.values(inningsState.batsmen || {})
      .filter((batter) => batter.status === "out" || batter.status === "batting" || batter.balls > 0 || batter.runs > 0)
      .map((batter) => Number(batter.playerId)),
  );

  if (nextBatterId) {
    const batterCard = inningsState.batsmen[String(nextBatterId)];
    if (batterCard && batterCard.status === "yet_to_bat") {
      return nextBatterId;
    }
  }

  for (const playerId of battingOrder) {
    const batterCard = inningsState.batsmen[String(playerId)];
    if (!seenIds.has(Number(playerId)) || batterCard?.status === "yet_to_bat") {
      return Number(playerId);
    }
  }

  return null;
}

function ensureBatterCards(lineup) {
  const batsmen = {};
  for (const [index, player] of (lineup?.battingOrder || []).entries()) {
    const playerSummaryRecord = lineup.players.find((item) => item.id === player);
    batsmen[String(player)] = {
      playerId: Number(player),
      name: playerSummaryRecord?.name || `Player ${player}`,
      battingOrder: index + 1,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      dots: 0,
      ones: 0,
      twos: 0,
      threes: 0,
      fives: 0,
      strikeRate: 0,
      status: "yet_to_bat",
      dismissal: null,
      isCaptain: playerSummaryRecord?.isCaptain || false,
      isWicketKeeper: playerSummaryRecord?.isWicketKeeper || false,
      enteredAt: null,
    };
  }

  return batsmen;
}

function ensureBowlerCards(lineup) {
  const bowlers = {};
  for (const playerId of lineup?.playingXI || []) {
    const playerSummaryRecord = lineup.players.find((item) => item.id === playerId);
    bowlers[String(playerId)] = {
      playerId: Number(playerId),
      name: playerSummaryRecord?.name || `Player ${playerId}`,
      legalBalls: 0,
      overs: 0,
      maidens: 0,
      runs: 0,
      wickets: 0,
      wides: 0,
      noBalls: 0,
      economy: 0,
      currentOverRuns: 0,
      currentOverBalls: 0,
      currentOverDeliveries: [],
      lastOverDeliveries: [],
    };
  }

  return bowlers;
}

function buildBallDisplay(event, scoring) {
  if (event.wicketType) {
    return { label: "W", variant: "wicket" };
  }

  if (event.extraType === "noball") {
    const runPart = scoring.batterRuns > 0 ? `${scoring.batterRuns}+` : "";
    return { label: `${runPart}nb`, variant: "noball" };
  }

  if (event.extraType === "wide") {
    return { label: scoring.teamRuns > 1 ? `${scoring.teamRuns}wd` : "wd", variant: "wide" };
  }

  const boundaryRuns = scoring.batterRuns || scoring.teamRuns;
  if (boundaryRuns === 6) {
    return { label: "6", variant: "six" };
  }

  if (boundaryRuns === 4) {
    return { label: "4", variant: "four" };
  }

  if (scoring.batterRuns === 0 && !event.extraType) {
    return { label: "•", variant: "dot" };
  }

  return { label: String(scoring.teamRuns), variant: "runs" };
}

function buildEmptyInningsState({ battingTeamId, bowlingTeamId, battingLineup, bowlingLineup, oversLimit, targetRuns }) {
  return {
    battingTeamId,
    bowlingTeamId,
    oversLimit,
    targetRuns,
    runs: 0,
    wickets: 0,
    legalBalls: 0,
    overs: 0,
    extras: {
      wide: 0,
      noball: 0,
      bye: 0,
      legbye: 0,
      penalty: 0,
      total: 0,
    },
    batsmen: ensureBatterCards(battingLineup),
    bowlers: ensureBowlerCards(bowlingLineup),
    currentPartnership: {
      batterAId: null,
      batterBId: null,
      runs: 0,
      balls: 0,
    },
    fallOfWickets: [],
    oversHistory: [],
    completed: false,
  };
}

export function createLineupPayload({ teamId, players, playersPerTeam }) {
  const orderedPlayers = [...players];
  const playingXI = orderedPlayers.slice(0, playersPerTeam).map((player) => Number(player.id));
  const captainId = orderedPlayers.find((player) => player.is_captain)?.id || playingXI[0] || null;
  const wicketKeeperId = orderedPlayers.find((player) => player.is_wicket_keeper)?.id || playingXI[0] || null;

  return {
    teamId,
    captainId: Number(captainId),
    wicketKeeperId: Number(wicketKeeperId),
    playingXI,
    battingOrder: [...playingXI],
    players: orderedPlayers.map((player) => ({
      id: Number(player.id),
      name: player.name,
      jerseyNumber: player.jersey_number,
      battingStyle: player.batting_style,
      bowlingStyle: player.bowling_style,
      isCaptain: player.is_captain,
      isViceCaptain: player.is_vice_captain,
      isWicketKeeper: player.is_wicket_keeper,
    })),
  };
}

export function createInitialLiveData({ team1Lineup, team2Lineup, oversLimit = 20 }) {
  return {
    version: 2,
    oversLimit,
    toss: {
      winnerTeamId: null,
      decision: null,
    },
    lineups: {
      team1: team1Lineup,
      team2: team2Lineup,
    },
    innings: {},
    current: {
      phase: "scheduled",
      inningsNumber: 1,
      battingTeamId: null,
      bowlingTeamId: null,
      strikerId: null,
      nonStrikerId: null,
      bowlerId: null,
      targetRuns: null,
      freeHit: false,
      requiresNewBowler: false,
      requiresNewBatter: false,
      pendingInningsTransition: null,
      winnerTeamId: null,
    },
    result: null,
  };
}

export function hydrateLiveData(liveData, matchRow) {
  const hydrated = clone(liveData && Object.keys(liveData).length ? liveData : createInitialLiveData({
    team1Lineup: { teamId: null, captainId: null, wicketKeeperId: null, playingXI: [], battingOrder: [], players: [] },
    team2Lineup: { teamId: null, captainId: null, wicketKeeperId: null, playingXI: [], battingOrder: [], players: [] },
    oversLimit: 20,
  }));

  if (!hydrated.innings) {
    hydrated.innings = {};
  }

  if (!hydrated.current) {
    hydrated.current = {
      phase: matchRow?.status === "live" ? "live" : "scheduled",
      inningsNumber: matchRow?.current_innings || 1,
      battingTeamId: null,
      bowlingTeamId: null,
      strikerId: matchRow?.striker_id || null,
      nonStrikerId: matchRow?.non_striker_id || null,
      bowlerId: matchRow?.bowler_id || null,
      targetRuns: null,
      freeHit: false,
      requiresNewBowler: false,
      requiresNewBatter: false,
      pendingInningsTransition: null,
      winnerTeamId: null,
    };
  }

  if (hydrated.current.pendingInningsTransition === undefined) {
    hydrated.current.pendingInningsTransition = null;
  }

  for (const [inningsKey, inningsState] of Object.entries(hydrated.innings || {})) {
    if (!inningsState) continue;

    const inningsNum = Number(inningsKey);
    if (!inningsState.battingTeamId && inningsNum === Number(hydrated.current?.inningsNumber)) {
      inningsState.battingTeamId = hydrated.current.battingTeamId;
      inningsState.bowlingTeamId = hydrated.current.bowlingTeamId;
    }

    if (inningsNum === 2 && hydrated.innings["1"]) {
      const first = hydrated.innings["1"];
      if (
        inningsState.battingTeamId &&
        first.battingTeamId &&
        Number(inningsState.battingTeamId) === Number(first.battingTeamId) &&
        first.bowlingTeamId
      ) {
        inningsState.battingTeamId = first.bowlingTeamId;
        inningsState.bowlingTeamId = first.battingTeamId;
      } else if (!inningsState.battingTeamId && first.bowlingTeamId) {
        inningsState.battingTeamId = first.bowlingTeamId;
        inningsState.bowlingTeamId = first.battingTeamId;
      }
    }

    if (!inningsState?.bowlers) continue;
    for (const bowler of Object.values(inningsState.bowlers)) {
      if (!bowler.currentOverDeliveries) bowler.currentOverDeliveries = [];
      if (!bowler.lastOverDeliveries) bowler.lastOverDeliveries = [];
    }
  }

  return hydrated;
}

export function startInnings(liveData, {
  inningsNumber = 1,
  battingTeamId,
  bowlingTeamId,
  strikerId,
  nonStrikerId,
  bowlerId,
  tossWinnerTeamId = null,
  tossDecision = null,
}) {
  const next = clone(liveData);
  const battingLineup = lineupForTeam(next, battingTeamId);
  const bowlingLineup = lineupForTeam(next, bowlingTeamId);

  if (!battingLineup || !bowlingLineup) {
    throw new Error("Selected teams are not part of this fixture.");
  }

  if (strikerId === nonStrikerId) {
    throw new Error("Striker and non-striker must be different players.");
  }

  if (!battingLineup.playingXI.includes(Number(strikerId)) || !battingLineup.playingXI.includes(Number(nonStrikerId))) {
    throw new Error("Opening batters must belong to the batting lineup.");
  }

  if (!bowlingLineup.playingXI.includes(Number(bowlerId))) {
    throw new Error("Selected bowler must belong to the bowling lineup.");
  }

  const targetRuns = inningsNumber === 2
    ? (next.innings["1"]?.runs || 0) + 1
    : null;

  const inningsState = buildEmptyInningsState({
    battingTeamId,
    bowlingTeamId,
    battingLineup,
    bowlingLineup,
    oversLimit: next.oversLimit || 20,
    targetRuns,
  });

  inningsState.batsmen[String(strikerId)].status = "batting";
  inningsState.batsmen[String(nonStrikerId)].status = "batting";
  inningsState.batsmen[String(strikerId)].enteredAt = "0.0";
  inningsState.batsmen[String(nonStrikerId)].enteredAt = "0.0";
  inningsState.currentPartnership = {
    batterAId: Number(strikerId),
    batterBId: Number(nonStrikerId),
    runs: 0,
    balls: 0,
  };

  next.innings[String(inningsNumber)] = inningsState;
  next.current = {
    phase: "live",
    inningsNumber,
    battingTeamId,
    bowlingTeamId,
    strikerId: Number(strikerId),
    nonStrikerId: Number(nonStrikerId),
    bowlerId: Number(bowlerId),
    targetRuns,
    freeHit: false,
    requiresNewBowler: false,
    requiresNewBatter: false,
    pendingInningsTransition: null,
    winnerTeamId: null,
  };

  if (tossWinnerTeamId) {
    next.toss = {
      winnerTeamId: Number(tossWinnerTeamId),
      decision: tossDecision || next.toss?.decision || null,
    };
  }

  return next;
}

function updateProjectionFromLiveData(matchRow, liveData) {
  const innings1 = liveData.innings["1"];
  const innings2 = liveData.innings["2"];
  const currentInnings = liveData.current.inningsNumber || 1;

  return {
    ...matchRow,
    current_innings: currentInnings,
    current_over: Math.floor((liveData.innings[String(currentInnings)]?.legalBalls || 0) / 6),
    current_ball: (liveData.innings[String(currentInnings)]?.legalBalls || 0) % 6,
    striker_id: liveData.current.strikerId,
    non_striker_id: liveData.current.nonStrikerId,
    bowler_id: liveData.current.bowlerId,
    status: liveData.current.phase === "completed" ? "completed" : liveData.current.phase === "live" ? "live" : matchRow.status,
    team1_score: innings1 ? serializeTeamScore(innings1) : serializeEmptyTeamScore(),
    team2_score: innings2 ? serializeTeamScore(innings2) : serializeEmptyTeamScore(),
    live_data: liveData,
  };
}

function serializeEmptyTeamScore() {
  return {
    runs: 0,
    wickets: 0,
    overs: 0,
    extras: 0,
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    runRate: 0,
  };
}

function serializeTeamScore(inningsState) {
  return {
    runs: inningsState.runs,
    wickets: inningsState.wickets,
    overs: ballsToOverValue(inningsState.legalBalls),
    extras: inningsState.extras.total,
    wides: inningsState.extras.wide,
    noBalls: inningsState.extras.noball,
    byes: inningsState.extras.bye,
    legByes: inningsState.extras.legbye,
    runRate: inningsState.legalBalls ? Number(((inningsState.runs * 6) / inningsState.legalBalls).toFixed(2)) : 0,
  };
}

function validateWicket(extraType, wicketType) {
  if (!wicketType) {
    return;
  }

  if (extraType === "wide" && !WIDE_ALLOWED_WICKETS.has(wicketType)) {
    throw new Error("Only stumped or run out dismissals are valid on a wide.");
  }

  if (extraType === "noball" && !NO_BALL_ALLOWED_WICKETS.has(wicketType)) {
    throw new Error("Only run out is valid on a no ball.");
  }
}

function runsBreakdown(event) {
  const runs = Number(event.runs || 0);
  const extraRunsInput = Number(event.extraRuns || 0);
  const extraType = event.extraType || null;

  if (!extraType) {
    return {
      batterRuns: runs,
      teamRuns: runs,
      extraRuns: 0,
      legalBall: true,
      batterFacedBall: true,
      bowlerRuns: runs,
    };
  }

  if (extraType === "wide") {
    // Extra runs field = total runs on the wide (e.g. 4 → 4wd), not 1 + extras.
    const totalExtras = extraRunsInput > 0 ? extraRunsInput : runs > 0 ? runs : 1;
    return {
      batterRuns: 0,
      teamRuns: totalExtras,
      extraRuns: totalExtras,
      legalBall: false,
      batterFacedBall: false,
      bowlerRuns: totalExtras,
    };
  }

  if (extraType === "noball") {
    const totalExtras = extraRunsInput > 0 ? extraRunsInput : 1;
    return {
      batterRuns: runs,
      teamRuns: runs + totalExtras,
      extraRuns: totalExtras,
      legalBall: false,
      batterFacedBall: true,
      bowlerRuns: runs + totalExtras,
    };
  }

  const teamExtraRuns = extraRunsInput > 0 ? extraRunsInput : runs;
  return {
    batterRuns: 0,
    teamRuns: teamExtraRuns,
    extraRuns: teamExtraRuns,
    legalBall: true,
    batterFacedBall: true,
    bowlerRuns: 0,
  };
}

function summaryText({ playerName, bowlerName, event, scoring }) {
  const wicketText = event.wicketType ? ` OUT (${event.wicketType.replace("_", " ")})` : "";

  if (!event.extraType) {
    if (scoring.batterRuns === 0) {
      return `${bowlerName} to ${playerName}, no run.${wicketText}`;
    }
    return `${bowlerName} to ${playerName}, ${scoring.batterRuns} run(s).${wicketText}`;
  }

  return `${bowlerName} to ${playerName}, ${scoring.teamRuns} total via ${event.extraType}.${wicketText}`;
}

function setBatterRunningStats(batterCard, batterRuns) {
  if (batterRuns === 0) {
    batterCard.dots += 1;
  }
  if (batterRuns === 1) batterCard.ones += 1;
  if (batterRuns === 2) batterCard.twos += 1;
  if (batterRuns === 3) batterCard.threes += 1;
  if (batterRuns === 5) batterCard.fives += 1;
  if (batterRuns === 4) batterCard.fours += 1;
  if (batterRuns === 6) batterCard.sixes += 1;
}

function resolveNextBatters({ inningsState, battingLineup, dismissedPlayerId, endStrikerId, endNonStrikerId, nextBatterId }) {
  if (!dismissedPlayerId) {
    return { strikerId: endStrikerId, nonStrikerId: endNonStrikerId, incomingBatterId: null };
  }

  const maxWickets = Math.max((battingLineup.playingXI || []).length - 1, 0);
  if (inningsState.wickets > maxWickets) {
    return { strikerId: null, nonStrikerId: null, incomingBatterId: null };
  }

  const incomingBatterId = nextAvailableBatter(
    inningsState,
    battingLineup.battingOrder || battingLineup.playingXI || [],
    nextBatterId ? Number(nextBatterId) : null,
  );

  if (!incomingBatterId) {
    return { strikerId: null, nonStrikerId: null, incomingBatterId: null };
  }

  if (Number(endStrikerId) === Number(dismissedPlayerId)) {
    return { strikerId: incomingBatterId, nonStrikerId: endNonStrikerId, incomingBatterId };
  }

  return { strikerId: endStrikerId, nonStrikerId: incomingBatterId, incomingBatterId };
}

function formatMomOvers(legalBalls = 0) {
  const overs = Math.floor(legalBalls / 6);
  const balls = legalBalls % 6;
  return balls ? `${overs}.${balls}` : `${overs}`;
}

function aggregateMatchPlayerStats(liveData) {
  const byId = new Map();

  for (const innings of Object.values(liveData.innings || {})) {
    const battingTeamId = Number(innings.battingTeamId);
    const bowlingTeamId = Number(innings.bowlingTeamId);

    for (const batter of Object.values(innings.batsmen || {})) {
      if (batter.status === "yet_to_bat" && !batter.runs && !batter.balls) continue;
      const id = Number(batter.playerId);
      const row = byId.get(id) || {
        playerId: id,
        name: batter.name,
        teamId: battingTeamId,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        notOut: false,
        dismissed: false,
        wickets: 0,
        runsConceded: 0,
        legalBalls: 0,
      };
      row.runs += batter.runs || 0;
      row.balls += batter.balls || 0;
      row.fours += batter.fours || 0;
      row.sixes += batter.sixes || 0;
      if (batter.status === "out" || batter.status === "retired_out") {
        row.dismissed = true;
      }
      if (batter.status === "batting" || batter.status === "not out") {
        row.notOut = true;
      }
      if (!row.name) row.name = batter.name;
      byId.set(id, row);
    }

    for (const bowler of Object.values(innings.bowlers || {})) {
      if (!bowler.legalBalls && !bowler.wickets && !bowler.runs) continue;
      const id = Number(bowler.playerId);
      const row = byId.get(id) || {
        playerId: id,
        name: bowler.name,
        teamId: bowlingTeamId,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        notOut: false,
        dismissed: false,
        wickets: 0,
        runsConceded: 0,
        legalBalls: 0,
      };
      row.wickets += bowler.wickets || 0;
      row.runsConceded += bowler.runs || 0;
      row.legalBalls += bowler.legalBalls || 0;
      if (!row.name) row.name = bowler.name;
      byId.set(id, row);
    }
  }

  return [...byId.values()]
    .map((row) => {
      if (row.dismissed) row.notOut = false;
      return row;
    })
    .filter((row) => row.runs > 0 || row.balls > 0 || row.wickets > 0 || row.legalBalls > 0);
}

function battingImpactPoints(player, { chaseWinner, isChaseInnings }) {
  const { runs = 0, balls = 0, notOut } = player;
  if (!balls && !runs) return 0;

  const sr = strikeRate(runs, balls);
  let points = runs;

  if (runs >= 30) points += 6;
  if (runs >= 50) points += 14;
  if (runs >= 75) points += 10;
  if (runs >= 100) points += 20;

  if (balls >= 6) {
    if (sr >= 150) points += 12;
    else if (sr >= 130) points += 8;
    else if (sr >= 110) points += 4;
    else if (sr < 70 && balls >= 12) points -= 4;
  }

  if (chaseWinner && isChaseInnings && notOut && runs >= 15) {
    points += 10;
  }
  if (notOut && runs >= 20) points += 5;

  return points;
}

function bowlingImpactPoints(player) {
  const { wickets = 0, legalBalls = 0, runsConceded = 0 } = player;
  if (!wickets && !legalBalls) return 0;

  let points = wickets * 22;

  if (wickets >= 2) points += 6;
  if (wickets >= 3) points += 14;
  if (wickets >= 4) points += 10;
  if (wickets >= 5) points += 18;

  if (legalBalls >= 6) {
    const econ = economy(runsConceded, legalBalls);
    if (econ <= 5) points += 16;
    else if (econ <= 6.5) points += 12;
    else if (econ <= 8) points += 6;
    else if (econ >= 11) points -= Math.min(10, Math.floor(econ - 10) * 3);
  }

  return points;
}

function buildMomProfile(player, reason) {
  const profile = {
    playerId: player.playerId,
    name: player.name,
    teamId: player.teamId,
    runs: player.runs || 0,
    balls: player.balls || 0,
    fours: player.fours || 0,
    sixes: player.sixes || 0,
    notOut: Boolean(player.notOut),
    wickets: player.wickets || 0,
    runsConceded: player.runsConceded || 0,
    legalBalls: player.legalBalls || 0,
    reason,
  };

  const lines = [];
  if (profile.balls > 0 || profile.runs > 0) {
    profile.battingLine = `${profile.runs}${profile.notOut ? "*" : ""} (${profile.balls})`;
    lines.push(profile.battingLine);
  }
  if (profile.wickets > 0 || profile.legalBalls > 0) {
    profile.overs = formatMomOvers(profile.legalBalls);
    profile.economy = economy(profile.runsConceded, profile.legalBalls);
    profile.bowlingLine = `${profile.wickets}/${profile.runsConceded} (${profile.overs} ov)`;
    lines.push(profile.bowlingLine);
  }

  if (profile.runs > 0 && profile.wickets > 0) {
    profile.role = "all-rounder";
  } else if (profile.wickets > 0 && profile.runs <= profile.wickets * 8) {
    profile.role = "bowler";
  } else {
    profile.role = "batter";
  }

  profile.performance = lines.join(" · ");
  return profile;
}

/**
 * Player of the Match (limited-overs standard):
 * - Chase won by wickets: leading not-out / top-order chase for the winner.
 * - Win defending a total: wicket-taking spell (3+ wkts) or economy, else innings-defining batter.
 * - Otherwise: highest combined batting + bowling impact, from the winning side when possible.
 */
export function computeManOfTheMatch(liveData, result) {
  const played = aggregateMatchPlayerStats(liveData);
  if (!played.length) return null;

  const winnerId = result?.winnerTeamId != null ? Number(result.winnerTeamId) : null;
  const innings2 = liveData.innings?.["2"];
  const wonByWickets = /won by (\d+) wicket/i.test(result?.summary || "");
  const chaseWinner =
    wonByWickets && innings2 && winnerId != null && Number(innings2.battingTeamId) === winnerId;

  const scorePlayer = (player) => {
    const isChaseInnings =
      chaseWinner &&
      player.teamId === winnerId &&
      innings2?.batsmen &&
      Object.values(innings2.batsmen).some((b) => Number(b.playerId) === Number(player.playerId));

    const bat = battingImpactPoints(player, { chaseWinner, isChaseInnings });
    const bowl = bowlingImpactPoints(player);
    let total = bat + bowl;

    if (winnerId != null && player.teamId === winnerId) {
      total *= 1.08;
    }

    return { player, total, bat, bowl };
  };

  const ranked = played.map(scorePlayer).sort((a, b) => b.total - a.total || b.bat - a.bat);

  let pick = null;
  let reason = "match_impact";

  if (chaseWinner && winnerId != null) {
    const chaseBatters = played
      .filter((p) => {
        if (p.teamId !== winnerId || !p.runs) return false;
        return Object.values(innings2.batsmen || {}).some(
          (b) => Number(b.playerId) === Number(p.playerId),
        );
      })
      .sort((a, b) => {
        if (a.notOut !== b.notOut) return a.notOut ? -1 : 1;
        return b.runs - a.runs || a.balls - b.balls;
      });

    if (chaseBatters[0]) {
      pick = chaseBatters[0];
      reason = pick.notOut ? "chase_not_out" : "chase_top_scorer";
    }
  }

  if (!pick && winnerId != null && !wonByWickets) {
    const winningBowlers = played
      .filter((p) => p.teamId === winnerId && p.wickets >= 2)
      .sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded);

    if (winningBowlers[0]?.wickets >= 3) {
      pick = winningBowlers[0];
      reason = "defining_spell";
    } else if (winningBowlers[0]?.wickets >= 2) {
      const topBowler = winningBowlers[0];
      const topImpact = ranked.find((r) => r.player.playerId === topBowler.playerId);
      const bestBatter = played
        .filter((p) => p.teamId === winnerId && p.runs >= 40)
        .sort((a, b) => b.runs - a.runs)[0];

      if (!bestBatter || (topImpact?.bowl || 0) >= battingImpactPoints(bestBatter, {}) * 0.85) {
        pick = topBowler;
        reason = "best_bowling";
      }
    }
  }

  if (!pick) {
    const pool =
      winnerId != null ? ranked.filter((r) => r.player.teamId === winnerId) : ranked;
    pick = (pool[0] || ranked[0])?.player || null;
    reason = winnerId != null ? "winning_impact" : "match_impact";
  }

  return pick ? buildMomProfile(pick, reason) : null;
}

export function ensureManOfTheMatch(liveData, result) {
  if (!result) return null;
  const mom = computeManOfTheMatch(liveData, result);
  if (!mom) return result;
  return { ...result, manOfTheMatch: mom };
}

function computeResult(liveData, battingLineup, bowlingLineup) {
  const innings1 = liveData.innings["1"];
  const innings2 = liveData.innings["2"];

  if (!innings1 || !innings2) {
    return null;
  }

  if (innings2.runs >= (innings2.targetRuns || 0)) {
    const wicketsRemaining = Math.max((battingLineup.playingXI?.length || 0) - 1 - innings2.wickets, 0);
    return {
      winnerTeamId: innings2.battingTeamId,
      summary: `${innings2.battingTeamId} won by ${wicketsRemaining} wicket(s)`,
    };
  }

  if (innings2.completed) {
    const margin = innings1.runs - innings2.runs;
    return {
      winnerTeamId: innings1.runs > innings2.runs ? innings1.battingTeamId : innings2.battingTeamId,
      summary: innings1.runs === innings2.runs
        ? "Match tied"
        : `${innings1.battingTeamId} won by ${margin} run(s)`,
    };
  }

  return null;
}

export function confirmNextBatter(liveData, nextBatterId) {
  const next = clone(liveData);
  const current = next.current;

  if (!current.requiresNewBatter) {
    throw new Error("No pending batter selection for this delivery.");
  }

  const inningsState = next.innings[String(current.inningsNumber || 1)];
  const battingLineup = lineupForTeam(next, current.battingTeamId);

  if (!inningsState || !battingLineup) {
    throw new Error("Live match setup is incomplete.");
  }

  const incomingId = Number(nextBatterId);
  const batterCard = inningsState.batsmen[String(incomingId)];

  if (!batterCard || batterCard.status !== "yet_to_bat") {
    throw new Error("Selected player cannot come in to bat.");
  }

  if (!current.strikerId) {
    current.strikerId = incomingId;
  } else if (!current.nonStrikerId) {
    current.nonStrikerId = incomingId;
  } else {
    throw new Error("Both batters are already at the crease.");
  }

  batterCard.status = "batting";
  batterCard.enteredAt = ballsToOverValue(inningsState.legalBalls).toString();
  current.requiresNewBatter = false;
  inningsState.currentPartnership.batterAId = current.strikerId;
  inningsState.currentPartnership.batterBId = current.nonStrikerId;

  return next;
}

export function confirmNextBowler(liveData, nextBowlerId) {
  const next = clone(liveData);
  const current = next.current;

  if (current.phase !== "live") {
    throw new Error("Match is not live.");
  }

  const inningsState = next.innings[String(current.inningsNumber || 1)];
  const bowlingLineup = lineupForTeam(next, current.bowlingTeamId);

  if (!inningsState || !bowlingLineup) {
    throw new Error("Live match setup is incomplete.");
  }

  const bowlerId = Number(nextBowlerId);
  if (!bowlingLineup.playingXI.includes(bowlerId)) {
    throw new Error("Selected bowler must belong to the bowling lineup.");
  }

  const startingNewOver = Boolean(current.requiresNewBowler);

  current.bowlerId = bowlerId;
  current.requiresNewBowler = false;

  const newBowlerCard = inningsState.bowlers[String(bowlerId)];
  if (newBowlerCard && startingNewOver) {
    newBowlerCard.currentOverDeliveries = [];
  }

  return next;
}

export function acknowledgeNextInnings(liveData) {
  const next = clone(liveData);

  if (next.current.pendingInningsTransition !== "second_innings") {
    throw new Error("First innings is not ready to hand over.");
  }

  next.current.pendingInningsTransition = null;
  next.current.phase = "innings_break";
  return next;
}

export function finalizeMatch(liveData) {
  const next = clone(liveData);

  if (next.current.pendingInningsTransition !== "match_complete") {
    throw new Error("Match is not ready to be ended.");
  }

  const innings2 = next.innings["2"];
  const battingLineup = lineupForTeam(next, innings2?.battingTeamId);
  const bowlingLineup = lineupForTeam(next, innings2?.bowlingTeamId);
  const result = computeResult(next, battingLineup, bowlingLineup);
  const manOfTheMatch = computeManOfTheMatch(next, result);

  next.result = {
    ...result,
    manOfTheMatch,
  };
  next.current.phase = "completed";
  next.current.pendingInningsTransition = null;
  next.current.winnerTeamId = result?.winnerTeamId || null;

  return next;
}

export function applyScoreEvent(liveData, event) {
  const next = clone(liveData);
  const current = next.current;

  if (current.phase !== "live") {
    throw new Error("Match is not live. Start an innings before scoring.");
  }

  if (current.pendingInningsTransition) {
    throw new Error("Complete the pending innings or match action before scoring.");
  }

  if (current.requiresNewBatter) {
    throw new Error("Select the next batter before recording the next delivery.");
  }

  if (current.requiresNewBowler) {
    throw new Error("Proceed to the next over before recording the next delivery.");
  }

  const inningsKey = String(current.inningsNumber || 1);
  const inningsState = next.innings[inningsKey];
  const battingLineup = lineupForTeam(next, current.battingTeamId);
  const bowlingLineup = lineupForTeam(next, current.bowlingTeamId);

  if (!inningsState || !battingLineup || !bowlingLineup) {
    throw new Error("Live match setup is incomplete.");
  }

  validateWicket(event.extraType, event.wicketType);

  if (event.wicketType === "caught" && !event.fielderId) {
    throw new Error("Select the fielder who took the catch.");
  }

  const strikerId = Number(current.strikerId);
  const nonStrikerId = Number(current.nonStrikerId);
  const bowlerId = Number(current.bowlerId);
  const strikerCard = inningsState.batsmen[String(strikerId)];
  const nonStrikerCard = inningsState.batsmen[String(nonStrikerId)];
  const bowlerCard = inningsState.bowlers[String(bowlerId)];

  if (!strikerCard || !nonStrikerCard || !bowlerCard) {
    throw new Error("Current striker, non-striker or bowler is missing from the lineup.");
  }

  const scoring = runsBreakdown(event);
  const dismissedPlayerId = event.wicketType ? Number(event.dismissedPlayerId || strikerId) : null;

  inningsState.runs += scoring.teamRuns;
  inningsState.extras.total += scoring.extraRuns;

  if (event.extraType) {
    inningsState.extras[event.extraType] += scoring.extraRuns;
  }

  if (scoring.batterFacedBall) {
    strikerCard.balls += 1;
  }

  strikerCard.runs += scoring.batterRuns;
  strikerCard.strikeRate = strikeRate(strikerCard.runs, strikerCard.balls);
  setBatterRunningStats(strikerCard, scoring.batterRuns);

  if (scoring.legalBall) {
    inningsState.legalBalls += 1;
    bowlerCard.legalBalls += 1;
    bowlerCard.currentOverBalls += 1;
  }

  bowlerCard.runs += scoring.bowlerRuns;
  bowlerCard.currentOverRuns += scoring.bowlerRuns;
  bowlerCard.overs = ballsToOverValue(bowlerCard.legalBalls);
  bowlerCard.economy = economy(bowlerCard.runs, bowlerCard.legalBalls);

  if (event.extraType === "wide") {
    bowlerCard.wides += scoring.extraRuns;
  }
  if (event.extraType === "noball") {
    bowlerCard.noBalls += scoring.extraRuns;
  }

  if (!bowlerCard.currentOverDeliveries) {
    bowlerCard.currentOverDeliveries = [];
  }
  bowlerCard.currentOverDeliveries.push(buildBallDisplay(event, scoring));

  inningsState.currentPartnership.runs += scoring.teamRuns;
  if (scoring.legalBall) {
    inningsState.currentPartnership.balls += 1;
  }

  const wicketCredited = event.wicketType ? CREDITED_WICKETS.has(event.wicketType) : false;
  if (event.wicketType) {
    inningsState.wickets += 1;
    const dismissedCard = inningsState.batsmen[String(dismissedPlayerId)];
    if (dismissedCard) {
      dismissedCard.status = "out";
      dismissedCard.dismissal = {
        type: event.wicketType,
        bowlerId,
        fielderId: event.fielderId ? Number(event.fielderId) : null,
        over: ballsToOverValue(inningsState.legalBalls),
        extraType: event.extraType || null,
      };
    }

    inningsState.fallOfWickets.push({
      wicket: inningsState.wickets,
      score: inningsState.runs,
      playerId: dismissedPlayerId,
      over: ballsToOverValue(inningsState.legalBalls),
    });

    if (wicketCredited) {
      bowlerCard.wickets += 1;
    }
  }

  let endStrikerId = strikerId;
  let endNonStrikerId = nonStrikerId;
  // Wides are illegal deliveries — striker keeps strike (no swap from wide runs).
  const rotateStrike =
    event.extraType !== "wide" && scoring.teamRuns % 2 === 1;
  if (rotateStrike) {
    endStrikerId = nonStrikerId;
    endNonStrikerId = strikerId;
  }

  let resolvedStrikerId = endStrikerId;
  let resolvedNonStrikerId = endNonStrikerId;
  let incomingBatterId = null;

  if (dismissedPlayerId) {
    const maxWickets = Math.max((battingLineup.playingXI?.length || 0) - 1, 0);
    const pendingBatter = nextAvailableBatter(
      inningsState,
      battingLineup.battingOrder || battingLineup.playingXI || [],
      event.nextBatterId ? Number(event.nextBatterId) : null,
    );

    if (!event.nextBatterId && pendingBatter && inningsState.wickets <= maxWickets) {
      current.requiresNewBatter = true;
      if (Number(endStrikerId) === Number(dismissedPlayerId)) {
        resolvedStrikerId = null;
        resolvedNonStrikerId = endNonStrikerId;
      } else {
        resolvedStrikerId = endStrikerId;
        resolvedNonStrikerId = null;
      }
    } else {
      const resolved = resolveNextBatters({
        inningsState,
        battingLineup,
        dismissedPlayerId,
        endStrikerId,
        endNonStrikerId,
        nextBatterId: event.nextBatterId || null,
      });
      resolvedStrikerId = resolved.strikerId;
      resolvedNonStrikerId = resolved.nonStrikerId;
      incomingBatterId = resolved.incomingBatterId;
      current.requiresNewBatter = false;
    }
  }

  if (incomingBatterId) {
    const incomingCard = inningsState.batsmen[String(incomingBatterId)];
    if (incomingCard) {
      incomingCard.status = "batting";
      incomingCard.enteredAt = ballsToOverValue(inningsState.legalBalls).toString();
    }
  }

  const overCompleted = scoring.legalBall && inningsState.legalBalls % 6 === 0;
  if (overCompleted) {
    bowlerCard.lastOverDeliveries = [...(bowlerCard.currentOverDeliveries || [])];
    bowlerCard.currentOverDeliveries = [];

    inningsState.oversHistory.push({
      over: inningsState.oversHistory.length + 1,
      bowlerId,
      runs: bowlerCard.currentOverRuns,
      wickets: inningsState.fallOfWickets.filter((item) => Math.floor(item.over) === inningsState.oversHistory.length).length,
      deliveries: bowlerCard.lastOverDeliveries,
    });

    if (bowlerCard.currentOverRuns === 0) {
      bowlerCard.maidens += 1;
    }

    bowlerCard.currentOverRuns = 0;
    bowlerCard.currentOverBalls = 0;
  }

  inningsState.overs = ballsToOverValue(inningsState.legalBalls);

  const wicketsLimit = Math.max((battingLineup.playingXI?.length || 0) - 1, 0);
  const oversLimitBalls = (inningsState.oversLimit || next.oversLimit || 20) * 6;
  const chaseCompleted = inningsState.targetRuns && inningsState.runs >= inningsState.targetRuns;
  const inningsCompleted = inningsState.wickets >= wicketsLimit || inningsState.legalBalls >= oversLimitBalls || chaseCompleted;

  let finalStrikerId = resolvedStrikerId;
  let finalNonStrikerId = resolvedNonStrikerId;

  if (!dismissedPlayerId) {
    current.requiresNewBatter = false;
  }

  if (overCompleted && !inningsCompleted) {
    finalStrikerId = resolvedNonStrikerId;
    finalNonStrikerId = resolvedStrikerId;
    current.requiresNewBowler = true;
  } else if (!inningsCompleted && !current.requiresNewBowler) {
    current.requiresNewBowler = false;
  }

  if (inningsCompleted) {
    inningsState.completed = true;
    current.strikerId = null;
    current.nonStrikerId = null;
    current.bowlerId = null;
    current.requiresNewBowler = false;
    current.requiresNewBatter = false;

    if (current.inningsNumber === 1) {
      current.pendingInningsTransition = "second_innings";
      current.targetRuns = inningsState.runs + 1;
    } else {
      current.pendingInningsTransition = "match_complete";
    }
  } else {
    current.strikerId = finalStrikerId;
    current.nonStrikerId = finalNonStrikerId;
  }

  if (!inningsCompleted) {
    inningsState.currentPartnership.batterAId = current.strikerId;
    inningsState.currentPartnership.batterBId = current.nonStrikerId;
  }

  const strikerName = playerSummary(next, strikerId)?.name || "Batter";
  const bowlerName = playerSummary(next, bowlerId)?.name || "Bowler";
  const commentary = summaryText({
    playerName: strikerName,
    bowlerName,
    event,
    scoring,
  });

  return {
    liveData: next,
    commentary,
    summary: {
      strikerId: current.strikerId,
      nonStrikerId: current.nonStrikerId,
      bowlerId: current.bowlerId,
      inningsCompleted,
      matchCompleted: current.phase === "completed",
      overCompleted,
      teamRuns: scoring.teamRuns,
      batterRuns: scoring.batterRuns,
      extraRuns: scoring.extraRuns,
      dismissedPlayerId,
      wicketCredited,
    },
  };
}

export function buildMatchRowUpdate(matchRow, liveData) {
  const updated = updateProjectionFromLiveData(matchRow, liveData);
  return {
    currentInnings: updated.current_innings,
    currentOver: updated.current_over,
    currentBall: updated.current_ball,
    strikerId: updated.striker_id,
    nonStrikerId: updated.non_striker_id,
    bowlerId: updated.bowler_id,
    team1Score: updated.team1_score,
    team2Score: updated.team2_score,
    status: updated.status,
    liveData: updated.live_data,
  };
}

export function buildPublicInningsState(liveData, inningsNumber = 1) {
  const inningsState = liveData.innings[String(inningsNumber)];
  if (!inningsState) {
    return null;
  }

  return {
    ...inningsState,
    batsmen: Object.values(inningsState.batsmen).sort((left, right) => left.battingOrder - right.battingOrder),
    bowlers: Object.values(inningsState.bowlers).sort((left, right) => right.legalBalls - left.legalBalls || left.name.localeCompare(right.name)),
  };
}
