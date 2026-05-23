"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import ManOfTheMatchPanel from "./ManOfTheMatchPanel";
import { fetchApi } from "../lib/api";
import {
  batterStatusLabel,
  formatExtras,
  formatMatchResultSummary,
  formatStrikeRate,
  phaseLabel,
  runRate,
  teamNameForBowlingInnings,
  teamNameForInnings,
} from "../lib/scorecard";

function BatsmenTable({ rows, strikerId, highlightLive, match }) {
  const battingRows = rows.filter((b) => b.status !== "yet_to_bat");

  if (battingRows.length === 0) {
    return <p className="text-xs text-subtext px-4 py-3">No batting data yet.</p>;
  }

  return (
    <table className="w-full text-xs sm:text-sm">
      <thead>
        <tr className="text-subtext border-b border-border bg-background/40 uppercase text-[10px] tracking-wider">
          <th className="text-left font-extrabold py-2.5 px-4">Batter</th>
          <th className="text-center font-extrabold py-2.5 w-10">R</th>
          <th className="text-center font-extrabold py-2.5 w-10">B</th>
          <th className="text-center font-extrabold py-2.5 w-10 hidden sm:table-cell">4s</th>
          <th className="text-center font-extrabold py-2.5 w-10 hidden sm:table-cell">6s</th>
          <th className="text-right font-extrabold py-2.5 px-4 w-14">SR</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/50">
        {battingRows.map((batter) => {
          const onStrike = highlightLive && Number(batter.playerId) === Number(strikerId);
          return (
            <tr key={batter.playerId} className={onStrike ? "bg-accent/10 font-bold" : ""}>
              <td className="py-2.5 px-4">
                <span className={onStrike ? "text-accent" : "text-text"}>
                  {batter.name}
                  {onStrike ? "*" : ""}
                </span>
                {batter.status !== "yet_to_bat" && (
                  <div
                    className={`text-[10px] font-normal mt-0.5 italic ${batter.status === "out" ? "text-subtext" : "text-accent/80"}`}
                  >
                    {batterStatusLabel(batter, match)}
                  </div>
                )}
              </td>
              <td className="text-center py-2.5 font-bold">{batter.runs}</td>
              <td className="text-center py-2.5 text-subtext">{batter.balls}</td>
              <td className="text-center py-2.5 text-subtext hidden sm:table-cell">{batter.fours}</td>
              <td className="text-center py-2.5 text-subtext hidden sm:table-cell">{batter.sixes}</td>
              <td className="text-right py-2.5 px-4 text-subtext">{formatStrikeRate(batter.strikeRate)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function BowlersTable({ rows, currentBowlerId, highlightLive }) {
  const active = rows.filter(
    (b) => (b.legalBalls || 0) > 0 || (b.runs || 0) > 0 || (b.wickets || 0) > 0,
  );

  if (active.length === 0) {
    return <p className="text-xs text-subtext px-4 py-3">No bowling data yet.</p>;
  }

  return (
    <table className="w-full text-xs sm:text-sm">
      <thead>
        <tr className="text-subtext border-b border-border bg-background/40 uppercase text-[10px] tracking-wider">
          <th className="text-left font-extrabold py-2.5 px-4">Bowler</th>
          <th className="text-center font-extrabold py-2.5 w-10">O</th>
          <th className="text-center font-extrabold py-2.5 w-8 hidden sm:table-cell">M</th>
          <th className="text-center font-extrabold py-2.5 w-10">R</th>
          <th className="text-center font-extrabold py-2.5 w-8">W</th>
          <th className="text-right font-extrabold py-2.5 px-4 w-14">Econ</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border/50">
        {active.map((bowler) => {
          const isCurrent = highlightLive && Number(bowler.playerId) === Number(currentBowlerId);
          return (
            <tr key={bowler.playerId} className={isCurrent ? "bg-accent/10 font-bold" : ""}>
              <td className={`py-2.5 px-4 ${isCurrent ? "text-accent" : "text-text"}`}>{bowler.name}</td>
              <td className="text-center py-2.5">{bowler.overs}</td>
              <td className="text-center py-2.5 text-subtext hidden sm:table-cell">{bowler.maidens}</td>
              <td className="text-center py-2.5">{bowler.runs}</td>
              <td className="text-center py-2.5 font-bold">{bowler.wickets}</td>
              <td className="text-right py-2.5 px-4 text-subtext">{bowler.economy ?? "0.00"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function InningsBlock({ match, inningsNumber, isLiveInnings, embedded = false }) {
  const innings = match[`innings${inningsNumber}`];
  if (!innings) return null;

  const teamName = teamNameForInnings(match, innings);
  const bowlingTeam = teamNameForBowlingInnings(match, innings);
  const crr = runRate(innings.runs, innings.legalBalls);

  return (
    <section
      className={`bg-card border border-border overflow-hidden ${
        embedded ? "rounded-b-xl border-t-0" : "rounded-xl"
      }`}
    >
      <div className="bg-background/60 border-b border-border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-base font-black text-text">
            {teamName}{" "}
            <span className="text-subtext font-bold text-sm">
              {innings.runs}/{innings.wickets} ({innings.overs} Ov)
            </span>
          </p>
        </div>
        <div className="text-[11px] text-subtext space-y-0.5 sm:text-right">
          <p>
            vs {bowlingTeam} · CRR <span className="text-text font-bold">{crr}</span>
          </p>
          {innings.targetRuns && (
            <p>
              Target <span className="text-accent font-bold">{innings.targetRuns}</span>
            </p>
          )}
        </div>
      </div>

      <div className="border-b border-border">
        <div className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-subtext bg-background/30">
          Batting
        </div>
        <BatsmenTable
          rows={innings.batsmen || []}
          strikerId={isLiveInnings ? match.liveData?.current?.strikerId : null}
          highlightLive={isLiveInnings}
          match={match}
        />
        <div className="px-4 py-2.5 text-xs text-subtext border-t border-border/50 bg-background/20">
          {formatExtras(innings.extras)}
        </div>
      </div>

      <div>
        <div className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-subtext bg-background/30">
          Bowling
        </div>
        <BowlersTable
          rows={innings.bowlers || []}
          currentBowlerId={isLiveInnings ? match.liveData?.current?.bowlerId : null}
          highlightLive={isLiveInnings}
        />
      </div>

      {innings.fallOfWickets?.length > 0 && (
        <div className="border-t border-border px-4 py-3 bg-background/20">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-subtext mb-2">
            Fall of Wickets
          </p>
          <p className="text-xs text-text leading-relaxed">
            {innings.fallOfWickets.map((fow, index) => (
              <span key={`${fow.wicket}-${fow.over}`}>
                {index > 0 ? ", " : ""}
                {fow.score}-{fow.wicket} ({fow.over} Ov)
              </span>
            ))}
          </p>
        </div>
      )}
    </section>
  );
}

export function MatchScorecardBody({ match, compact = false }) {
  const [inningsTab, setInningsTab] = useState(1);

  const livePhase = match?.liveData?.current?.phase;
  const currentInningsNum = match?.liveData?.current?.inningsNumber || match?.current_innings || 1;
  const hasInnings1 = Boolean(match?.innings1);
  const hasInnings2 = Boolean(match?.innings2);
  const isLive = livePhase === "live" || livePhase === "innings_break";
  const resultSummary = formatMatchResultSummary(match);
  const isComplete =
    match?.liveData?.current?.phase === "completed" || match?.status === "completed";

  useEffect(() => {
    if (hasInnings2 && !hasInnings1) setInningsTab(2);
    else if (hasInnings1) setInningsTab(hasInnings2 ? 2 : 1);
  }, [hasInnings1, hasInnings2, match?.fixture_id]);

  if (!match) return null;

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {!compact && (
        <header className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="bg-[#1a2e1f] border-b border-[#276F43]/40 px-4 py-2 flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-subtext flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-accent" />
              {match.ground || "Ground TBD"}
            </span>
            <span className="text-[10px] font-extrabold uppercase text-subtext">
              {phaseLabel(livePhase)}
            </span>
          </div>
          <div className="px-4 py-4 space-y-2">
            <h2 className="text-lg font-extrabold font-display">
              {match.team1Name}{" "}
              <span className="text-subtext font-bold text-sm">vs</span> {match.team2Name}
            </h2>
            {resultSummary && <p className="text-xs font-bold text-accent">{resultSummary}</p>}
          </div>
        </header>
      )}

      {isComplete && <ManOfTheMatchPanel match={match} />}

      <div className="space-y-0">
        <div className="flex border-b border-border bg-card rounded-t-xl overflow-hidden">
          {[
            { id: 1, label: "1st Innings" },
            { id: 2, label: "2nd Innings" },
          ].map((tab) => {
            const hasData = tab.id === 1 ? hasInnings1 : hasInnings2;
            const isActive = inningsTab === tab.id;
            const isLiveInnings = isLive && currentInningsNum === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInningsTab(tab.id)}
                disabled={!hasData}
                className={`flex-1 py-3 text-xs sm:text-sm font-extrabold uppercase tracking-wider border-b-2 transition-colors ${
                  isActive
                    ? "border-accent text-accent bg-accent/10"
                    : "border-transparent text-subtext hover:text-text"
                } ${!hasData ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {tab.label}
                {isLiveInnings && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-red-500 align-middle" />
                )}
              </button>
            );
          })}
        </div>

        {inningsTab === 1 && hasInnings1 && (
          <InningsBlock
            match={match}
            inningsNumber={1}
            isLiveInnings={isLive && currentInningsNum === 1}
            embedded
          />
        )}
        {inningsTab === 2 && hasInnings2 && (
          <InningsBlock
            match={match}
            inningsNumber={2}
            isLiveInnings={isLive && currentInningsNum === 2}
            embedded
          />
        )}
        {inningsTab === 1 && !hasInnings1 && (
          <div className="bg-card border border-border border-t-0 rounded-b-xl p-6 text-sm text-subtext text-center">
            1st innings scorecard not available.
          </div>
        )}
        {inningsTab === 2 && !hasInnings2 && (
          <div className="bg-card border border-border border-t-0 rounded-b-xl p-6 text-sm text-subtext text-center">
            2nd innings was not played.
          </div>
        )}
      </div>
    </div>
  );
}

export function MatchScorecardLoader({ fixtureId, compact = false }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!fixtureId) return undefined;
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetchApi(`/matches/${fixtureId}`);
        if (!active) return;
        setMatch(res.data);
      } catch (err) {
        if (active) setError(err.message || "Failed to load scorecard.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [fixtureId]);

  if (loading) {
    return <p className="text-xs text-subtext py-4">Loading scorecard…</p>;
  }
  if (error) {
    return <p className="text-xs text-red-400 py-4">{error}</p>;
  }
  return <MatchScorecardBody match={match} compact={compact} />;
}
