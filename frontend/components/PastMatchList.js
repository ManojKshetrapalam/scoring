"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, Calendar, ChevronRight, MapPin, Trophy } from "lucide-react";
import { fetchApi } from "../lib/api";
import { formatMomPerformance } from "./ManOfTheMatchPanel";

function resolveResultLine(item) {
  if (item.resultSummary) return item.resultSummary;

  const result = item.result;
  if (!result?.summary) return null;

  const winnerId = result.winnerTeamId;
  let winnerName = result.winnerTeamName;
  if (!winnerName && winnerId != null) {
    if (Number(item.team1Id) === Number(winnerId)) winnerName = item.team1Name;
    else if (Number(item.team2Id) === Number(winnerId)) winnerName = item.team2Name;
  }

  let summary = result.summary;
  if (winnerName && /^Team won/i.test(summary)) {
    const wicketsMatch = summary.match(/won by (\d+) wicket/i);
    if (wicketsMatch) {
      const n = Number(wicketsMatch[1]);
      summary = `${winnerName} won by ${n} wicket${n === 1 ? "" : "s"}`;
    } else {
      const runsMatch = summary.match(/won by (\d+) run/i);
      if (runsMatch) {
        const n = Number(runsMatch[1]);
        summary = `${winnerName} won by ${n} run${n === 1 ? "" : "s"}`;
      } else {
        summary = `${winnerName} won`;
      }
    }
    const mom = result.manOfTheMatch?.name;
    if (mom && !summary.includes(mom)) {
      summary = `${summary} · MoM: ${mom}`;
    }
  }

  return summary;
}

export default function PastMatchList({ tournamentId = null, title = "Past Matches" }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const path = tournamentId
          ? `/matches/past?tournamentId=${tournamentId}`
          : "/matches/past";
        const res = await fetchApi(path);
        if (!active) return;
        setMatches(res.data || []);
      } catch (err) {
        if (active) setError(err.message || "Failed to load past matches.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-sm text-subtext">
        Loading {title.toLowerCase()}…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-red-500/30 rounded-2xl p-6 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-sm text-subtext">
        No completed matches yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-extrabold font-display">{title}</h2>
      <div className="space-y-3">
        {matches.map((item) => {
          const resultLine = resolveResultLine(item);
          const mom = item.result?.manOfTheMatch;
          const momPerformance = formatMomPerformance(mom);

          return (
            <article
              key={item.fixtureId}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="px-4 sm:px-6 py-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider">
                  {!tournamentId && (
                    <span className="inline-flex items-center gap-1 text-accent">
                      <Trophy className="w-3 h-3" />
                      {item.tournamentName ||
                        (item.matchKind === "friendly" ? "Friendly" : "Match")}
                    </span>
                  )}
                  {item.matchDate && (
                    <span className="text-subtext inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.matchDate}
                    </span>
                  )}
                  {item.ground && (
                    <span className="text-subtext inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.ground}
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-text">
                  {item.team1Name}{" "}
                  <span className="text-subtext font-bold text-sm">vs</span> {item.team2Name}
                </h3>

                {resultLine && (
                  <p className="text-xs font-bold text-accent">{resultLine}</p>
                )}

                {mom?.name && (
                  <p className="text-[11px] text-subtext flex flex-wrap items-center gap-x-1 gap-y-0.5">
                    <Award className="w-3 h-3 text-yellow-500 shrink-0" />
                    <span>
                      Man of the Match:{" "}
                      <span className="font-bold text-text">{mom.name}</span>
                      {momPerformance && (
                        <span className="text-accent font-semibold"> — {momPerformance}</span>
                      )}
                    </span>
                  </p>
                )}

                <Link
                  href={`/live_scorecard/${item.fixtureId}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-hover transition-colors"
                >
                  Open full match page
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
