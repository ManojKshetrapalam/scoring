"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { io } from "socket.io-client";
import { Activity, ArrowRight, Calendar, ChevronRight, Flame, MapPin, Trophy, Users, Zap } from "lucide-react";
import { fetchApi, socketPath, socketUrl } from "../lib/api";

export default function LandingPage() {
  const [tournaments, setTournaments] = useState([]);
  const [liveMatch, setLiveMatch] = useState(null);
  const [commentary, setCommentary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadHome() {
      try {
        setLoading(true);
        setError("");

        const [tournamentRes, liveRes] = await Promise.all([
          fetchApi("/tournaments"),
          fetchApi("/matches/live"),
        ]);

        if (!active) return;

        setTournaments(tournamentRes.data || []);

        const firstLive = liveRes.data?.[0];
        if (firstLive?.fixture_id) {
          const [matchRes, commentaryRes] = await Promise.all([
            fetchApi(`/matches/${firstLive.fixture_id}`),
            fetchApi(`/matches/${firstLive.fixture_id}/commentary`),
          ]);

          if (!active) return;

          setLiveMatch(matchRes.data);
          setCommentary(commentaryRes.data || []);
        } else {
          setLiveMatch(null);
          setCommentary([]);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || "Unable to load homepage data.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHome();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!liveMatch?.fixture_id) {
      return undefined;
    }

    const socket = io(socketUrl, {
      path: socketPath,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("join_match", Number(liveMatch.fixture_id));
    });

    socket.on("score_update", (updatedState) => {
      if (updatedState && typeof updatedState === "object") {
        setLiveMatch(updatedState);
      }
    });

    socket.on("commentary_update", (newBall) => {
      setCommentary((prev) => [newBall, ...prev].slice(0, 8));
    });

    return () => {
      socket.emit("leave_match", liveMatch.fixture_id);
      socket.disconnect();
    };
  }, [liveMatch?.fixture_id]);

  const activeTournamentCount = tournaments.filter((tournament) => tournament.status === "active").length;

  const liveScoreSummary = liveMatch?.currentInningsState
    ? {
        runs: liveMatch.currentInningsState.runs,
        wickets: liveMatch.currentInningsState.wickets,
        overs: liveMatch.currentInningsState.overs,
      }
    : liveMatch?.team1_score;

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-border min-h-[520px] flex items-center shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/stadium_hero.png')" }}
          role="img"
          aria-label="Night view of a futuristic glowing corporate cricket stadium"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-[#122A1E] border border-[#235C3A] px-4 py-1.5 rounded-full text-accent font-extrabold text-xs uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />
              Corporate Sports Leagues
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display leading-tight tracking-tight">
              Premium Corporate Cricket
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-emerald-400 to-white">
                Powered By Real Match Data
              </span>
            </h1>

            <p className="text-subtext text-sm sm:text-base leading-relaxed max-w-xl">
              Browse live tournaments, follow score updates, and manage registrations from the same cricket platform.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link href="/register" className="bg-accent hover:bg-accent-hover text-black font-black px-6 py-3 rounded-lg text-sm sm:text-base flex items-center gap-2 transition-all">
                Register Corporate Team
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/tournaments" className="glass-panel border border-white/10 text-white font-bold px-6 py-3 rounded-lg text-sm sm:text-base flex items-center gap-2 transition-all">
                Explore Tournaments
                <ChevronRight className="w-4 h-4 text-accent" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="glass-panel rounded-2xl p-6 border border-white/15 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-accent">Live Match Center</span>
                {liveMatch && (
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase text-red-500">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Live
                  </span>
                )}
              </div>

              {loading && <p className="text-sm text-subtext">Loading latest match and tournament data...</p>}
              {!loading && error && <p className="text-sm text-red-400">{error}</p>}
              {!loading && !error && !liveMatch && (
                <p className="text-sm text-subtext">No live match is available right now. Check the tournaments page for upcoming fixtures.</p>
              )}

              {liveMatch && (
                <>
                  <Link
                    href={`/live_scorecard/${liveMatch.fixture_id}`}
                    className="block bg-slate-950/65 rounded-xl border border-white/5 p-4 space-y-4 hover:border-accent/40 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-subtext uppercase font-bold tracking-wider flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-accent" />
                          {liveMatch.ground}
                        </div>
                        <h3 className="text-lg font-extrabold text-white mt-2">
                          {liveMatch.team1Name} vs {liveMatch.team2Name}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black font-display text-accent">
                          {liveScoreSummary?.runs ?? 0}/{liveScoreSummary?.wickets ?? 0}
                        </div>
                        <p className="text-xs text-subtext">{liveScoreSummary?.overs ?? "0.0"} overs</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-background/40 rounded-lg p-3 border border-white/5">
                        <div className="text-[10px] uppercase text-subtext font-bold">Striker</div>
                        <div className="text-text font-bold mt-1">
                          {liveMatch.strikerName ? `${liveMatch.strikerName}*` : "TBD"}
                        </div>
                      </div>
                      <div className="bg-background/40 rounded-lg p-3 border border-white/5">
                        <div className="text-[10px] uppercase text-subtext font-bold">Bowler</div>
                        <div className="text-text font-bold mt-1">{liveMatch.bowlerName || "TBD"}</div>
                      </div>
                    </div>

                    <p className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1 group-hover:gap-2 transition-all">
                      View full scorecard
                      <ChevronRight className="w-3.5 h-3.5" />
                    </p>
                  </Link>

                  <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-white/40 uppercase font-black tracking-widest">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-accent" />
                        Ball-By-Ball Commentary
                      </span>
                    </div>

                    {commentary.length === 0 ? (
                      <p className="text-subtext">No commentary has been recorded for this match yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto divide-y divide-white/5">
                        {commentary.map((ball) => (
                          <p key={ball.id ?? `${ball.over_num}-${ball.ball_num}-${ball.created_at}`} className="pt-2 text-text leading-relaxed text-[11px] first:pt-0 first:border-none">
                            {ball.description}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 text-accent text-xs font-black uppercase tracking-wider">
            <Trophy className="w-4 h-4" />
            Tournaments
          </div>
          <p className="text-3xl font-black mt-3">{tournaments.length}</p>
          <p className="text-xs text-subtext mt-2">Total tournaments available in the system.</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 text-accent text-xs font-black uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            Active
          </div>
          <p className="text-3xl font-black mt-3">{activeTournamentCount}</p>
          <p className="text-xs text-subtext mt-2">Tournaments currently marked active.</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 text-accent text-xs font-black uppercase tracking-wider">
            <Users className="w-4 h-4" />
            Match Feed
          </div>
          <p className="text-3xl font-black mt-3">{commentary.length}</p>
          <p className="text-xs text-subtext mt-2">Recent commentary entries loaded for the live match.</p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-accent font-extrabold text-xs uppercase tracking-widest">
              <Calendar className="w-4 h-4" />
              Championships Directory
            </div>
            <h2 className="text-3xl font-extrabold font-display tracking-tight mt-2">Available Tournaments</h2>
          </div>
          <Link href="/tournaments" className="text-sm font-bold text-accent hover:text-accent-hover">
            View all
          </Link>
        </div>

        {tournaments.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-sm text-subtext">
            No tournaments are available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tournaments.slice(0, 3).map((tournament) => (
              <div key={tournament.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-3 py-0.5 rounded font-extrabold uppercase text-[9px] bg-[#1C3A27] text-accent border border-[#276F43]">
                      {tournament.status}
                    </span>
                    <span className="text-accent uppercase font-bold tracking-wider text-[9px]">
                      {String(tournament.type).replaceAll("_", " ")}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">{tournament.name}</h3>
                  <p className="text-xs text-subtext">
                    {tournament.venue_details?.ground_name || "Venue TBD"}
                    {tournament.venue_details?.address ? `, ${tournament.venue_details.address}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-subtext uppercase">Prize Pool</div>
                    <div className="text-lg font-black text-accent">
                      {tournament.prize_money ? `₹${Number(tournament.prize_money).toLocaleString("en-IN")}` : "TBD"}
                    </div>
                  </div>
                  <Link href={`/tournaments/${tournament.id}`} className="bg-background border border-border text-text font-bold text-xs px-4 py-2 rounded-lg">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
