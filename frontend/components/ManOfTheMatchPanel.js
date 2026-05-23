"use client";

import { Award } from "lucide-react";
import { teamNameForId } from "../lib/scorecard";

export function formatMomPerformance(mom) {
  if (!mom) return null;
  if (mom.performance) return mom.performance;
  const parts = [];
  if (mom.battingLine) parts.push(mom.battingLine);
  else if (mom.balls > 0 || mom.runs > 0) {
    parts.push(`${mom.runs}${mom.notOut ? "*" : ""} (${mom.balls})`);
  }
  if (mom.bowlingLine) parts.push(mom.bowlingLine);
  else if (mom.wickets > 0 || mom.legalBalls > 0) {
    const overs = mom.overs ?? "0";
    parts.push(`${mom.wickets}/${mom.runsConceded ?? 0} (${overs} ov)`);
  }
  return parts.length ? parts.join(" · ") : null;
}

export default function ManOfTheMatchPanel({ match, className = "" }) {
  const mom = match?.result?.manOfTheMatch;
  const isComplete =
    match?.liveData?.current?.phase === "completed" || match?.status === "completed";

  if (!isComplete || !mom?.name) return null;

  const performance = formatMomPerformance(mom);
  const teamLabel = teamNameForId(
    {
      team1Name: match.team1Name,
      team2Name: match.team2Name,
      team1Id: match.team1Id,
      team2Id: match.team2Id,
      liveData: match.liveData,
    },
    mom.teamId,
  );

  return (
    <section
      className={`bg-gradient-to-r from-[#2a2410] to-card border border-yellow-500/35 rounded-xl overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-9 h-9 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
            <Award className="w-5 h-5 text-yellow-400" />
          </span>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-yellow-500/90">
              Man of the Match
            </p>
            <p className="text-base sm:text-lg font-black text-text leading-tight">{mom.name}</p>
          </div>
        </div>

        <div className="sm:ml-auto sm:text-right space-y-0.5 min-w-0">
          {teamLabel && teamLabel !== "Team" && (
            <p className="text-[10px] font-bold uppercase text-subtext tracking-wide">{teamLabel}</p>
          )}
          {performance && (
            <p className="text-sm font-bold text-accent">{performance}</p>
          )}
          {/* {(mom.fours > 0 || mom.sixes > 0) && (
            <p className="text-[10px] text-subtext">
              {mom.fours > 0 ? `${mom.fours}×4` : ""}
              {mom.fours > 0 && mom.sixes > 0 ? " · " : ""}
              {mom.sixes > 0 ? `${mom.sixes}×6` : ""}
            </p>
          )} */}
        </div>
      </div>
    </section>
  );
}
