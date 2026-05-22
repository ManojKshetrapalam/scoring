export function teamNameForId(match, teamId) {
  const lineups = match?.liveData?.lineups;
  if (!lineups || teamId == null) return "Team";

  if (Number(lineups.team1?.teamId) === Number(teamId)) {
    return match.team1Name || "Team 1";
  }
  if (Number(lineups.team2?.teamId) === Number(teamId)) {
    return match.team2Name || "Team 2";
  }
  return `Team ${teamId}`;
}

export function formatStrikeRate(value) {
  const rate = Number(value);
  if (!Number.isFinite(rate)) return "0.00";
  return rate.toFixed(2);
}

export function runRate(runs = 0, legalBalls = 0) {
  if (!legalBalls) return "0.00";
  return ((runs * 6) / legalBalls).toFixed(2);
}

export function requiredRunRate({ runs, targetRuns, legalBalls, oversLimit = 20 }) {
  if (!targetRuns) return null;
  const runsNeeded = targetRuns - runs;
  const ballsLeft = oversLimit * 6 - legalBalls;
  if (ballsLeft <= 0 || runsNeeded <= 0) return "0.00";
  return ((runsNeeded * 6) / ballsLeft).toFixed(2);
}

export function formatExtras(extras = {}) {
  const total = extras.total || 0;
  const wide = extras.wide || 0;
  const noball = extras.noball || 0;
  const bye = extras.bye || 0;
  const legbye = extras.legbye || 0;
  return `Extras ${total} (b ${bye}, lb ${legbye}, w ${wide}, nb ${noball})`;
}

export function batterStatusLabel(batter, match) {
  if (!batter) return "";
  if (batter.status === "yet_to_bat") return "";
  if (batter.status === "out") return formatDismissal(batter, match);
  return "not out";
}

export function formatDismissal(batter, match) {
  if (!batter) return "";
  if (batter.status === "yet_to_bat") return "";
  if (batter.status === "batting" || batter.status === "not out") return "not out";

  const dismissal = batter.dismissal;
  if (!dismissal?.type) return "out";

  const type = String(dismissal.type).replaceAll("_", " ");
  const bowlerName = dismissal.bowlerId
    ? playerNameFromInnings(match, dismissal.bowlerId)
    : null;
  const fielderName = dismissal.fielderId
    ? playerNameFromInnings(match, dismissal.fielderId)
    : null;

  switch (dismissal.type) {
    case "bowled":
      return bowlerName ? `b ${bowlerName}` : "bowled";
    case "caught":
      if (fielderName && bowlerName) return `c ${fielderName} b ${bowlerName}`;
      if (fielderName) return `c ${fielderName}`;
      return bowlerName ? `c & b ${bowlerName}` : "caught";
    case "lbw":
      return bowlerName ? `lbw b ${bowlerName}` : "lbw";
    case "stumped":
      return bowlerName ? `st ${bowlerName}` : "stumped";
    case "runout":
      return "run out";
    case "hit_wicket":
      return bowlerName ? `hit wicket b ${bowlerName}` : "hit wicket";
    case "retired_out":
      return "retired out";
    default:
      return type;
  }
}

function playerNameFromInnings(match, playerId) {
  for (const key of ["innings1", "innings2"]) {
    const innings = match[key];
    if (!innings) continue;
    const batter = innings.batsmen?.find((b) => Number(b.playerId) === Number(playerId));
    if (batter) return batter.name;
    const bowler = innings.bowlers?.find((b) => Number(b.playerId) === Number(playerId));
    if (bowler) return bowler.name;
  }
  const all = [
    ...(match.liveData?.lineups?.team1?.players || []),
    ...(match.liveData?.lineups?.team2?.players || []),
  ];
  const fromLineup = all.find((p) => Number(p.id) === Number(playerId))?.name;
  if (fromLineup) return fromLineup;

  for (const innings of Object.values(match.liveData?.innings || {})) {
    const fromBatsman = Object.values(innings.batsmen || {}).find(
      (p) => Number(p.playerId) === Number(playerId),
    );
    if (fromBatsman?.name) return fromBatsman.name;
    const fromBowler = Object.values(innings.bowlers || {}).find(
      (p) => Number(p.playerId) === Number(playerId),
    );
    if (fromBowler?.name) return fromBowler.name;
  }

  return "";
}

export function phaseLabel(phase, pendingTransition = null) {
  if (pendingTransition === "second_innings") return "Innings 1 Complete";
  if (pendingTransition === "match_complete") return "Innings 2 Complete";

  const labels = {
    scheduled: "Scheduled",
    live: "Live",
    innings_break: "Innings Break",
    completed: "Completed",
  };
  return labels[phase] || phase || "Match";
}

export function ballCircleClass(variant) {
  switch (variant) {
    case "four":
      return "bg-yellow-400 text-black border-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.35)]";
    case "six":
      return "bg-emerald-500 text-white border-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.35)]";
    case "wicket":
    case "noball":
      return "bg-red-500 text-white border-red-600 shadow-[0_0_12px_rgba(239,68,68,0.35)]";
    case "wide":
      return "bg-orange-500/90 text-white border-orange-600";
    default:
      return "bg-background text-text border-border";
  }
}

export function bowlerOverDeliveries(bowlerCard, awaitingNextOver = false) {
  if (!bowlerCard) return [];
  if (awaitingNextOver) {
    return bowlerCard.lastOverDeliveries || [];
  }
  return bowlerCard.currentOverDeliveries || [];
}

export function resolveBowlerDeliveries(match, awaitingNextOver = false) {
  const inningsNum = match?.liveData?.current?.inningsNumber || match?.current_innings || 1;
  const bowlerId = match?.liveData?.current?.bowlerId;
  const innings = match?.liveData?.innings?.[String(inningsNum)];
  const rawBowler = innings?.bowlers?.[String(bowlerId)];

  if (awaitingNextOver) {
    if (rawBowler?.lastOverDeliveries?.length) return rawBowler.lastOverDeliveries;
    const history = innings?.oversHistory || [];
    const lastOver = history[history.length - 1];
    if (lastOver?.deliveries?.length) return lastOver.deliveries;
    return bowlerOverDeliveries(match?.bowlerCard, true);
  }

  if (rawBowler?.currentOverDeliveries?.length) return rawBowler.currentOverDeliveries;
  return bowlerOverDeliveries(match?.bowlerCard, false);
}

export function inningsSummaryLine(innings, teamName, isCurrentInnings, match) {
  if (!innings) return null;
  const score = `${innings.runs}/${innings.wickets}`;
  const overs = innings.overs ?? "0.0";
  let line = `${teamName} ${score} (${overs} Ov)`;

  if (isCurrentInnings && match?.targetRuns && innings.targetRuns) {
    const rrr = requiredRunRate({
      runs: innings.runs,
      targetRuns: innings.targetRuns,
      legalBalls: innings.legalBalls,
      oversLimit: innings.oversLimit || match.liveData?.oversLimit || 20,
    });
    const needed = innings.targetRuns - innings.runs;
    line += ` — Need ${needed} from ${Math.max((innings.oversLimit || 20) * 6 - innings.legalBalls, 0)} balls (RRR ${rrr})`;
  }

  return line;
}
