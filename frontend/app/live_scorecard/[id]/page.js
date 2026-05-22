"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Radio,
} from "lucide-react";
import { fetchApi, socketPath, socketUrl } from "../../../lib/api";
import {
  ballCircleClass,
  batterStatusLabel,
  resolveBowlerDeliveries,
  formatDismissal,
  formatExtras,
  formatStrikeRate,
  inningsSummaryLine,
  phaseLabel,
  runRate,
  teamNameForId,
} from "../../../lib/scorecard";

function BallCircles({ deliveries = [], title = "This over" }) {
  if (!deliveries.length) {
    return (
      <p className="text-[10px] text-subtext px-4 pb-3">No balls bowled in this over yet.</p>
    );
  }

  return (
    <div className="px-4 pb-4 pt-1">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-subtext mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {deliveries.map((ball, index) => (
          <span
            key={`${ball.label}-${index}`}
            className={`inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-full border text-xs font-black ${ballCircleClass(ball.variant)}`}
            title={ball.variant}
          >
            {ball.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function BowlerLivePanel({ match, bowler, awaitingNextOver }) {
  if (!bowler) {
    return <p className="text-xs text-subtext px-4 py-3">Bowler TBD</p>;
  }

  const deliveries = resolveBowlerDeliveries(match, awaitingNextOver);

  return (
    <div>
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="text-subtext border-b border-border bg-background/40 uppercase text-[10px] tracking-wider">
            <th className="text-left font-extrabold py-2.5 px-4">Bowler</th>
            <th className="text-center font-extrabold py-2.5 w-10">O</th>
            <th className="text-center font-extrabold py-2.5 w-10">R</th>
            <th className="text-center font-extrabold py-2.5 w-8">W</th>
            <th className="text-right font-extrabold py-2.5 px-4 w-14">Econ</th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-accent/10 font-bold">
            <td className="py-2.5 px-4 text-accent">{bowler.name}</td>
            <td className="text-center py-2.5">{bowler.overs}</td>
            <td className="text-center py-2.5">{bowler.runs}</td>
            <td className="text-center py-2.5 font-bold">{bowler.wickets}</td>
            <td className="text-right py-2.5 px-4 text-subtext">{bowler.economy ?? "0.00"}</td>
          </tr>
        </tbody>
      </table>
      <BallCircles
        deliveries={deliveries}
        title={awaitingNextOver ? "Completed over" : "Ball-by-ball (this over)"}
      />
    </div>
  );
}

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
            <tr
              key={batter.playerId}
              className={onStrike ? "bg-accent/10 font-bold" : ""}
            >
              <td className="py-2.5 px-4">
                <span className={onStrike ? "text-accent" : "text-text"}>
                  {batter.name}
                  {onStrike ? "*" : ""}
                </span>
                {batter.status !== "yet_to_bat" && (
                  <div className={`text-[10px] font-normal mt-0.5 italic ${batter.status === "out" ? "text-subtext" : "text-accent/80"}`}>
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
  const active = rows.filter((b) => (b.legalBalls || 0) > 0 || (b.runs || 0) > 0 || (b.wickets || 0) > 0);

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

function InningsBlock({ match, inningsNumber, isLiveInnings }) {
  const innings = match[`innings${inningsNumber}`];
  if (!innings) return null;

  const teamName = teamNameForId(match, innings.battingTeamId);
  const bowlingTeam = teamNameForId(match, innings.bowlingTeamId);
  const crr = runRate(innings.runs, innings.legalBalls);

  return (
    <section className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="bg-background/60 border-b border-border px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold font-display uppercase tracking-wide text-accent">
            Innings {inningsNumber}
          </h3>
          <p className="text-base font-black text-text mt-0.5">
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

export default function LiveScorecardPage() {
  const params = useParams();
  const fixtureId = params?.id;

  const [match, setMatch] = useState(null);
  const [commentary, setCommentary] = useState([]);
  const [activeTab, setActiveTab] = useState("scorecard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!fixtureId) return undefined;
    let active = true;

    async function loadMatch() {
      try {
        setLoading(true);
        setError("");
        const [matchRes, commentaryRes] = await Promise.all([
          fetchApi(`/matches/${fixtureId}`),
          fetchApi(`/matches/${fixtureId}/commentary`),
        ]);
        if (!active) return;
        setMatch(matchRes.data);
        setCommentary(commentaryRes.data || []);
      } catch (err) {
        if (active) setError(err.message || "Failed to load scorecard.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMatch();
    return () => {
      active = false;
    };
  }, [fixtureId]);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!fixtureId) return undefined;

    const socket = io(socketUrl, {
      path: socketPath,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    const handleScoreUpdate = (updated) => {
      if (updated && typeof updated === "object") {
        setMatch(updated);
      }
    };

    const handleCommentaryUpdate = (ball) => {
      setCommentary((prev) => [ball, ...prev]);
    };

    socket.on("connect", () => {
      socket.emit("join_match", Number(fixtureId));
    });
    socket.on("score_update", handleScoreUpdate);
    socket.on("commentary_update", handleCommentaryUpdate);

    return () => {
      socket.off("score_update", handleScoreUpdate);
      socket.off("commentary_update", handleCommentaryUpdate);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [fixtureId]);

  const livePhase = match?.liveData?.current?.phase;
  const pendingTransition = match?.liveData?.current?.pendingInningsTransition;
  const awaitingNextOver = Boolean(
    match?.requiresNewBowler ?? match?.liveData?.current?.requiresNewBowler,
  );
  const isLive = livePhase === "live" || livePhase === "innings_break" || pendingTransition;
  const currentInningsNum = match?.liveData?.current?.inningsNumber || match?.current_innings || 1;

  const inningsSummaries = useMemo(() => {
    if (!match) return [];
    const items = [];
    if (match.innings1) {
      items.push({
        number: 1,
        innings: match.innings1,
        teamName: teamNameForId(match, match.innings1.battingTeamId),
        isCurrent: isLive && currentInningsNum === 1,
      });
    }
    if (match.innings2) {
      items.push({
        number: 2,
        innings: match.innings2,
        teamName: teamNameForId(match, match.innings2.battingTeamId),
        isCurrent: isLive && currentInningsNum === 2,
      });
    }
    return items;
  }, [match, isLive, currentInningsNum]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center text-subtext text-sm">
        Loading live scorecard...
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-accent">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <div className="bg-card border border-red-500/30 rounded-xl p-6 text-sm text-red-400">
          {error || "Match not found."}
        </div>
      </div>
    );
  }

  const partnership = match.currentInningsState?.currentPartnership;
  const partnershipText = partnership?.batterAId
    ? `Partnership ${partnership.runs} (${partnership.balls} balls)`
    : null;

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-bold text-accent hover:text-accent-hover transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Match header — Cricbuzz-style compact banner */}
      <header className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-[#1a2e1f] border-b border-[#276F43]/40 px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-subtext flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-accent" />
            {match.ground || "Ground TBD"}
          </span>
          {isLive && (
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live
            </span>
          )}
        </div>

        <div className="px-4 py-4 space-y-3">
          <h1 className="text-lg sm:text-xl font-extrabold font-display leading-snug">
            {match.team1Name}{" "}
            <span className="text-subtext font-bold text-sm">vs</span>{" "}
            {match.team2Name}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded bg-background border border-border text-accent">
              {phaseLabel(livePhase, pendingTransition)}
            </span>
            {match.result?.summary && (
              <span className="text-xs font-bold text-accent">{match.result.summary}</span>
            )}
          </div>

          {/* Innings score lines */}
          <div className="space-y-2 border-t border-border pt-3">
            {inningsSummaries.map(({ number, innings, teamName, isCurrent }) => (
              <div
                key={number}
                className={`text-sm ${isCurrent ? "font-bold text-text" : "text-subtext"}`}
              >
                {inningsSummaryLine(innings, teamName, isCurrent, match)}
              </div>
            ))}
            {inningsSummaries.length === 0 && (
              <p className="text-sm text-subtext">Match not started yet.</p>
            )}
          </div>

          {match.toss?.winnerTeamId && (
            <p className="text-[11px] text-subtext">
              Toss: {teamNameForId(match, match.toss.winnerTeamId)} chose to{" "}
              {match.toss.decision || "—"}
            </p>
          )}
        </div>
      </header>

      {pendingTransition && (
        <section className="bg-card border border-accent/30 rounded-xl px-4 py-4 text-sm text-center">
          <p className="font-extrabold text-accent uppercase tracking-wider text-xs">
            {pendingTransition === "second_innings" ? "Innings 1 complete" : "Innings 2 complete"}
          </p>
          <p className="text-subtext text-xs mt-2">
            {pendingTransition === "second_innings"
              ? `Target: ${match.liveData?.current?.targetRuns ?? "—"}`
              : "Awaiting match result confirmation from scorer."}
          </p>
        </section>
      )}

      {/* Live batsmen / bowler strip (when innings is live) */}
      {livePhase === "live" && !pendingTransition && match.currentInningsState && (
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-accent/10 flex items-center gap-2">
            <Radio className="w-4 h-4 text-accent" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-accent">
              Live — Innings {currentInningsNum}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            <div>
              <div className="px-4 py-2 text-[10px] font-extrabold uppercase text-subtext">Batter</div>
              <BatsmenTable
                rows={
                  [match.strikerCard, match.nonStrikerCard].filter(Boolean).length
                    ? [match.strikerCard, match.nonStrikerCard]
                    : match.currentInningsState.batsmen?.filter((b) => b.status === "batting") || []
                }
                strikerId={match.liveData?.current?.strikerId}
                highlightLive
                match={match}
              />
            </div>
            <div>
              <div className="px-4 py-2 text-[10px] font-extrabold uppercase text-subtext">Bowler</div>
              <BowlerLivePanel match={match} bowler={match.bowlerCard} awaitingNextOver={awaitingNextOver} />
            </div>
          </div>

          {partnershipText && (
            <div className="px-4 py-2.5 border-t border-border text-xs text-subtext bg-background/30">
              {partnershipText}
              {match.currentInningsState?.legalBalls != null && (
                <span className="ml-3">
                  CRR{" "}
                  <strong className="text-text">
                    {runRate(
                      match.currentInningsState.runs,
                      match.currentInningsState.legalBalls,
                    )}
                  </strong>
                </span>
              )}
            </div>
          )}
        </section>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border sticky top-16 z-40 bg-background/95 backdrop-blur-sm">
        {[
          { id: "scorecard", label: "Scorecard" },
          { id: "commentary", label: "Commentary" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-xs sm:text-sm font-extrabold uppercase tracking-wide border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-subtext hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "scorecard" && (
        <div className="space-y-4">
          <InningsBlock
            match={match}
            inningsNumber={1}
            isLiveInnings={livePhase === "live" && currentInningsNum === 1}
          />
          <InningsBlock
            match={match}
            inningsNumber={2}
            isLiveInnings={livePhase === "live" && currentInningsNum === 2}
          />
          {!match.innings1 && !match.innings2 && (
            <div className="bg-card border border-border rounded-xl p-6 text-sm text-subtext text-center">
              Full scorecard will appear once the innings begins.
            </div>
          )}
        </div>
      )}

      {activeTab === "commentary" && (
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-background/40">
            <h2 className="text-sm font-extrabold font-display">Ball by Ball Commentary</h2>
          </div>
          {commentary.length === 0 ? (
            <p className="px-4 py-6 text-sm text-subtext">No commentary recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border/50 max-h-[70vh] overflow-y-auto">
              {commentary.map((ball) => (
                <li key={ball.id} className="px-4 py-3 text-sm hover:bg-background/30 transition-colors">
                  <div className="flex gap-3">
                    <span className="shrink-0 text-[10px] font-black text-accent uppercase w-16">
                      {ball.over_num}.{ball.ball_num}
                    </span>
                    <p className="text-text leading-relaxed flex-1">{ball.description}</p>
                    <ChevronRight className="w-4 h-4 text-border shrink-0 hidden sm:block" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
