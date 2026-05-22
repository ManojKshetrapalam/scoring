"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { io } from "socket.io-client";
import { 
  Trophy, Play, Star, Calendar, MapPin, Users, Award, 
  ArrowRight, Zap, Target, Flame, Activity, ShieldCheck, ChevronRight 
} from "lucide-react";

export default function LandingPage() {
  const [liveMatch, setLiveMatch] = useState({
    team1Name: "Google Giants",
    team2Name: "Microsoft Mavericks",
    current_innings: 1,
    team1_score: { runs: 123, wickets: 4, overs: 14.3 },
    team2_score: { runs: 0, wickets: 0, overs: 0.0 },
    strikerName: "Virat Kohli",
    nonStrikerName: "Rohit Sharma",
    bowlerName: "Mitchell Starc",
    ground: "Gevents Stadium Arena A - Main Pitch"
  });

  const [recentCommentary, setRecentCommentary] = useState([
    { id: 1, text: "Starc to Kohli, FOUR! Beautifully driven through extra cover." },
    { id: 2, text: "Starc to Kohli, 1 run, pushed down to long-on for a quick single." },
    { id: 3, text: "Starc to Kohli, 1 run, nudged into the gap." }
  ]);

  // Connect to live WebSocket events if backend is running
  useEffect(() => {
    const isProd = process.env.NODE_ENV === "production";
    const socketUrl = isProd ? window.location.origin : "http://localhost:5001";
    const socketPath = isProd ? "/scoring/socket.io" : "/socket.io";

    const socket = io(socketUrl, {
      path: socketPath
    });

    socket.on("connect", () => {
      console.log("Connected to Live WebSocket channel.");
      socket.emit("join_match", 1); // Subscribe to Match 1 live feeds
    });

    socket.on("score_update", (updatedState) => {
      console.log("Real-time score tick received:", updatedState);
      setLiveMatch(prev => ({
        ...prev,
        current_innings: updatedState.current_innings,
        team1_score: updatedState.team1_score,
        team2_score: updatedState.team2_score
      }));
    });

    socket.on("commentary_update", (newBall) => {
      console.log("Real-time commentary block received:", newBall);
      setRecentCommentary(prev => [
        { id: Date.now(), text: newBall.description },
        ...prev.slice(0, 4)
      ]);
    });

    // High-fidelity fallback interval to simulate match shifts live
    const fallbackInterval = setInterval(() => {
      setLiveMatch(prev => {
        const score = prev.current_innings === 1 ? prev.team1_score : prev.team2_score;
        let newBalls = score.overs;
        let currentOver = Math.floor(newBalls);
        let currentBall = Math.round((newBalls - currentOver) * 10);

        currentBall += 1;
        if (currentBall >= 6) {
          currentOver += 1;
          currentBall = 0;
        }

        const newOvers = parseFloat(`${currentOver}.${currentBall}`);
        const runsScored = Math.random() > 0.6 ? (Math.random() > 0.8 ? 4 : Math.random() > 0.95 ? 6 : 1) : 0;
        const wicketFell = Math.random() > 0.96;

        const newRuns = score.runs + runsScored;
        const newWickets = score.wickets + (wicketFell ? 1 : 0);

        // Generate dynamic mock comments
        if (runsScored > 0 || wicketFell) {
          const ballText = wicketFell 
            ? `Starc to Kohli, OUT! Clean bowled! Off stump is out of the ground! Absolute peach of a delivery.`
            : `Starc to Kohli, ${runsScored === 4 ? "FOUR! Incredibly timed punch past point! Classic Kohli cover drive." : runsScored === 6 ? "SIX! Dispatched deep over wide long-on. Breathtaking clean strike!" : "1 run, driven down to long-off to keep the strike."}`;
          
          setRecentCommentary(cPrev => [{ id: Date.now(), text: ballText }, ...cPrev.slice(0, 4)]);
        }

        return {
          ...prev,
          team1_score: {
            ...prev.team1_score,
            runs: newRuns,
            wickets: newWickets,
            overs: newOvers
          }
        };
      });
    }, 8000);

    return () => {
      socket.disconnect();
      clearInterval(fallbackInterval);
    };
  }, []);

  return (
    <div className="space-y-12">
      
      {/* 1. STUNNING HERO SECTION WITH STADIUM UNDERLAY */}
      <section className="relative overflow-hidden rounded-3xl border border-border min-h-[580px] flex items-center shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
        
        {/* Background Image with Rich Dark Gradient Masks */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10000ms] hover:scale-105"
          style={{ 
            backgroundImage: "url('/images/stadium_hero.png')", 
          }} 
          role="img"
          aria-label="Night view of a futuristic glowing corporate cricket stadium"
        />
        
        {/* Dark-Blue Sports Underlay (combines glassmorphism colors with brand guidelines) */}
        <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(57,255,20,0.1),transparent_60%)] animate-pulse" />
        
        {/* Hero Content Wrapper */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main Copy Area */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 bg-[#122A1E] border border-[#235C3A] px-4 py-1.5 rounded-full text-accent font-extrabold text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(57,255,20,0.15)]">
              <Zap className="w-3.5 h-3.5 animate-bounce" />
              Corporate Sports Leagues
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display leading-tight tracking-tight">
              Premium Corporate <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-emerald-400 to-white drop-shadow-sm">
                Cricket Arenas
              </span>
            </h1>
            
            <p className="text-subtext text-sm sm:text-base leading-relaxed max-w-xl">
              Organizing India's most premium corporate leagues. From high-octane **Leather Ball Tournaments** on professional pitches to elite **Turf Box Cricket** leagues under neon lights, Gevents Unlimited delivers professional sporting aesthetics, HD coverage, and real-time live match statistics.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <Link 
                href="/register" 
                className="bg-accent hover:bg-accent-hover text-black font-black px-6 py-3 rounded-lg text-sm sm:text-base flex items-center gap-2 transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-[0_4px_20px_rgba(57,255,20,0.3)] focus-visible:outline"
              >
                Register Corporate Team
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href="/tournaments" 
                className="glass-panel hover:bg-slate-900/60 border border-white/10 hover:border-white/20 text-white font-bold px-6 py-3 rounded-lg text-sm sm:text-base flex items-center gap-2 transition-all duration-300 transform hover:translate-y-[-1px] focus-visible:outline"
              >
                Explore Tournaments
                <ChevronRight className="w-4 h-4 text-accent" />
              </Link>
            </div>
          </div>

          {/* DYNAMIC HIGH-FIDELITY LIVE SCORECARD DRAWER */}
          <div className="lg:col-span-5 w-full">
            <div className="glass-panel rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/15 space-y-6">
              
              {/* Scorecard Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 live-radar" />
                  <span className="text-red-500 font-black text-xs uppercase tracking-wider animate-pulse">LIVE NOW</span>
                  <span className="text-white/20">•</span>
                  <span className="text-xs text-subtext truncate max-w-[150px] sm:max-w-[200px]" title={liveMatch.ground}>
                    {liveMatch.ground.split(" - ")[0]}
                  </span>
                </div>
                <span className="bg-accent/15 border border-accent/30 text-[10px] text-accent font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  LEATHER BALL
                </span>
              </div>

              {/* LIVE TEAM STATS ROW */}
              <div className="bg-slate-950/65 rounded-xl border border-white/5 p-4 space-y-4">
                
                {/* Team Info Block */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-emerald-700 flex items-center justify-center text-black font-black text-sm shadow-[0_4px_10px_rgba(57,255,20,0.2)]">
                      {liveMatch.team1Name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-white">{liveMatch.team1Name}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-accent uppercase font-extrabold tracking-wider">
                        <Activity className="w-3 h-3 text-accent animate-pulse" />
                        1st Innings Batting
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-black font-display text-accent tracking-tight">
                      {liveMatch.team1_score.runs}/{liveMatch.team1_score.wickets}
                    </div>
                    <p className="text-[10px] sm:text-xs text-subtext font-bold uppercase tracking-wider mt-0.5">
                      {liveMatch.team1_score.overs} Overs
                    </p>
                  </div>
                </div>

                {/* Micro Batsmen/Bowler Panel */}
                <div className="border-t border-white/5 pt-3 grid grid-cols-12 gap-2 text-xs text-subtext">
                  <div className="col-span-7 flex flex-col justify-center space-y-1">
                    <div className="flex justify-between text-text font-bold pr-2 border-r border-white/10">
                      <span className="truncate">{liveMatch.strikerName}*</span>
                      <span className="text-accent">{Math.round(liveMatch.team1_score.runs * 0.43)} <span className="text-[10px] text-subtext font-normal">(34)</span></span>
                    </div>
                    <div className="flex justify-between pr-2 border-r border-white/10 text-white/50">
                      <span className="truncate">{liveMatch.nonStrikerName}</span>
                      <span>{Math.round(liveMatch.team1_score.runs * 0.31)} <span className="text-[10px] text-subtext/40 font-normal">(28)</span></span>
                    </div>
                  </div>
                  
                  <div className="col-span-5 flex flex-col justify-center pl-2 space-y-1">
                    <div className="text-[9px] text-white/40 uppercase font-black">Active Bowler</div>
                    <div className="font-bold text-text truncate">{liveMatch.bowlerName}</div>
                    <div className="text-[10px] text-accent font-semibold">3.3 overs • 1/19</div>
                  </div>
                </div>

              </div>

              {/* REAL-TIME BALL COMMENTARY FEED */}
              <div className="bg-slate-950/40 border border-white/5 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between text-[9px] text-white/40 uppercase font-black tracking-widest">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-accent animate-pulse" />
                    Ball-By-Ball commentary
                  </span>
                  <span className="text-accent flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                    Real-time
                  </span>
                </div>
                <div className="h-20 overflow-y-auto space-y-2 pr-1 scrollbar-thin divide-y divide-white/5">
                  {recentCommentary.map((comm, idx) => (
                    <p 
                      key={comm.id} 
                      className={`text-text pt-2 leading-relaxed text-[11px] first:pt-0 first:text-white first:font-medium transition-all duration-300 ${idx === 0 ? "border-none" : ""}`}
                    >
                      {idx === 0 && <span className="inline-block bg-accent/25 border border-accent/40 text-[9px] text-accent font-black px-1.5 py-0.5 rounded-sm mr-2 uppercase tracking-tighter">New</span>}
                      {comm.text}
                    </p>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 2. MATCH FORMATS CATEGORY */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center justify-center gap-1 text-[10px] text-accent uppercase font-black tracking-widest bg-accent/10 px-3 py-1 rounded-full border border-accent/25">
            Sporting Portfolios
          </div>
          <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-white">
            Corporate Tournament Formats
          </h2>
          <p className="text-subtext text-xs sm:text-sm">
            Whether inside neon-lit turf cages or on professional standard grass fields, Gevents manages it all.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              title: "Leather Ball Cricket", 
              desc: "Traditional 20-over professional championships with certified leather balls, specialized white cricket kit alignments, and live commentators.", 
              color: "border-red-500/20 hover:border-red-500/60 hover:shadow-[0_8px_30px_rgba(239,68,68,0.1)]", 
              accentBg: "bg-red-950/30 text-red-400" 
            },
            { 
              title: "Turf Box Cricket", 
              desc: "High-octane 8-a-side matches held inside professional turf box configurations under intense neon LED floodlights.", 
              color: "border-accent/20 hover:border-accent hover:shadow-[0_8px_30px_rgba(57,255,20,0.1)]", 
              accentBg: "bg-accent/15 text-accent" 
            },
            { 
              title: "Turf Cricket", 
              desc: "Open turf tournaments utilizing advanced light-tennis balls, designed specifically for rapid action and heavy scoring rates.", 
              color: "border-sky-500/20 hover:border-sky-500/60 hover:shadow-[0_8px_30px_rgba(14,165,233,0.1)]", 
              accentBg: "bg-sky-950/30 text-sky-400" 
            },
            { 
              title: "Indoor Arena", 
              desc: "Short, quick-fire corporate configurations hosted in custom temperature-controlled indoor cages with continuous nets.", 
              color: "border-purple-500/20 hover:border-purple-500/60 hover:shadow-[0_8px_30px_rgba(168,85,247,0.1)]", 
              accentBg: "bg-purple-950/30 text-purple-400" 
            }
          ].map((fmt, i) => (
            <div 
              key={i} 
              className={`glass-panel rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 ${fmt.color}`}
            >
              <div className="space-y-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${fmt.accentBg}`}>
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-lg text-white group-hover:text-accent transition-colors duration-300">{fmt.title}</h3>
                <p className="text-xs text-subtext leading-relaxed">{fmt.desc}</p>
              </div>
              <div className="pt-4 flex items-center text-[10px] text-accent font-extrabold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Explore rules
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. ACTIVE CHAMPIONSHIPS WITH FULL GLASSMORPHISM CARDS */}
      <section className="space-y-6">
        <div className="flex justify-between items-end border-b border-border pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] text-accent uppercase font-black tracking-widest mb-1">
              <Trophy className="w-3.5 h-3.5" />
              Championship Brackets
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
              Upcoming Tournaments
            </h2>
            <p className="text-xs text-subtext mt-0.5">Register your corporate squad to lock in the match scheduling</p>
          </div>
          <Link 
            href="/tournaments" 
            className="text-accent hover:text-accent-hover text-xs font-black flex items-center gap-1 hover:gap-1.5 transition-all focus-visible:outline"
          >
            View All Tournaments
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Tournament Card 1 */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 shadow-xl flex flex-col justify-between transition-all duration-300 hover:shadow-[0_15px_35px_rgba(0,0,0,0.3)]">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="bg-[#122A1E] text-accent text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-[#235C3A]">
                  Leather Ball Cup
                </span>
                <span className="text-accent font-black text-sm tracking-tight bg-accent/5 px-2.5 py-0.5 rounded border border-accent/15">
                  ₹1,00,000 Prize
                </span>
              </div>
              <h3 className="text-xl font-bold font-display leading-snug text-white">
                Gevents Corporate Cricket Cup 2026
              </h3>
              <p className="text-subtext text-xs leading-relaxed">
                The grandest annual corporate tournament in Pune. Featuring 16 top multi-national enterprise rosters battling across fully-equipped grass grounds under certified leather ball guidelines. HD cameras, points matrices, and complete live scorer panels are included.
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs text-subtext pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span>June 12, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span className="truncate">Kharadi Stadium, Pune</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-950/40 border-t border-white/5 px-6 py-4 flex justify-between items-center">
              <span className="text-[10px] uppercase font-extrabold text-accent">
                12 / 16 Slots Filled
              </span>
              <Link 
                href="/register" 
                className="bg-accent hover:bg-accent-hover text-black font-black text-xs px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] focus-visible:outline"
              >
                Register Team
              </Link>
            </div>
          </div>

          {/* Tournament Card 2 */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 shadow-xl flex flex-col justify-between transition-all duration-300 hover:shadow-[0_15px_35px_rgba(0,0,0,0.3)]">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="bg-sky-950/40 text-sky-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-sky-800/40">
                  Turf Box Tournament
                </span>
                <span className="text-accent font-black text-sm tracking-tight bg-accent/5 px-2.5 py-0.5 rounded border border-accent/15">
                  ₹50,000 Prize
                </span>
              </div>
              <h3 className="text-xl font-bold font-display leading-snug text-white">
                Baner Corporate Turf Box League
              </h3>
              <p className="text-subtext text-xs leading-relaxed">
                High-intensity, hyper-paced 8-a-side box matches inside fully net-enclosed premium turf setups. Fast light-tennis bowling, tight run boundaries, background DJ audio systems, and fully active scoreboards for a festival-grade sporting ambiance.
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs text-subtext pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span>July 05, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span className="truncate">Gevents Turf Park, Baner</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-950/40 border-t border-white/5 px-6 py-4 flex justify-between items-center">
              <span className="text-[10px] uppercase font-extrabold text-accent">
                6 / 8 Slots Filled
              </span>
              <Link 
                href="/register" 
                className="bg-accent hover:bg-accent-hover text-black font-black text-xs px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] focus-visible:outline"
              >
                Register Team
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 4. PREMIUM POINTS STANDINGS & STATS SHOWCASE */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Points Table Widget */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="font-extrabold font-display text-lg tracking-tight text-white">
                Points Standings - Corporate Cup
              </h3>
              <p className="text-[10px] text-subtext uppercase font-bold tracking-wider mt-0.5">
                Active stats counting dynamic NRR & run aggregates
              </p>
            </div>
            <span className="bg-emerald-950 text-accent border border-accent/25 text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-wider">
              Updated Live
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-subtext uppercase text-[9px] font-black tracking-widest">
                  <th className="pb-3 text-left">Team Name</th>
                  <th className="pb-3 text-center">Played</th>
                  <th className="pb-3 text-center">Won</th>
                  <th className="pb-3 text-center">Lost</th>
                  <th className="pb-3 text-center">Net NRR</th>
                  <th className="pb-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {[
                  { name: "Google Giants", p: 4, w: 3, l: 1, nrr: "+1.450", pts: 6, isLive: true },
                  { name: "Microsoft Mavericks", p: 4, w: 2, l: 2, nrr: "+0.320", pts: 4 },
                  { name: "Meta Masters", p: 4, w: 1, l: 3, nrr: "-0.840", pts: 2 }
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] group transition-colors">
                    <td className="py-4 font-extrabold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent/20 flex items-center justify-center text-[8px] font-black border border-accent/30 text-accent group-hover:bg-accent group-hover:text-black transition-all">
                        {i + 1}
                      </span>
                      {row.name}
                      {row.isLive && (
                        <span className="inline-flex items-center gap-1 bg-accent/15 border border-accent/30 px-1.5 py-0.5 rounded text-[8px] text-accent uppercase font-black">
                          <span className="w-1 h-1 rounded-full bg-accent live-radar" />
                          Live
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-center text-subtext font-bold">{row.p}</td>
                    <td className="py-4 text-center text-white">{row.w}</td>
                    <td className="py-4 text-center text-white">{row.l}</td>
                    <td className={`py-4 text-center font-bold ${parseFloat(row.nrr) > 0 ? "text-accent" : "text-red-500"}`}>
                      {row.nrr}
                    </td>
                    <td className="py-4 text-right font-black text-accent text-sm tracking-tight">{row.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orange / Purple Cap leaders spotlight */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Orange Cap Card */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-lg relative overflow-hidden group hover:border-orange-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/15 transition-all" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-black font-black text-xs shadow-[0_4px_12px_rgba(249,115,22,0.3)]">
                  O
                </div>
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-widest text-orange-500">Orange Cap</h4>
                  <p className="text-[9px] text-subtext font-bold">Leading Batsman</p>
                </div>
              </div>
              
              <div className="flex justify-between items-end">
                <div>
                  <p className="font-black text-lg text-white">Virat Kohli</p>
                  <span className="text-[10px] text-subtext font-semibold uppercase">Google Giants</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-orange-500 tracking-tight block">342 Runs</span>
                  <p className="text-[9px] text-subtext mt-0.5">4 Matches • SR 148.5</p>
                </div>
              </div>
            </div>
          </div>

          {/* Purple Cap Card */}
          <div className="glass-panel rounded-2xl p-6 border border-white/10 shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/15 transition-all" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                <div className="w-7 h-7 rounded-lg bg-purple-500 flex items-center justify-center text-white font-black text-xs shadow-[0_4px_12px_rgba(168,85,247,0.3)]">
                  P
                </div>
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-widest text-purple-500">Purple Cap</h4>
                  <p className="text-[9px] text-subtext font-bold">Leading Bowler</p>
                </div>
              </div>
              
              <div className="flex justify-between items-end">
                <div>
                  <p className="font-black text-lg text-white">Mitchell Starc</p>
                  <span className="text-[10px] text-subtext font-semibold uppercase">Microsoft Mavericks</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-purple-500 tracking-tight block">11 Wkts</span>
                  <p className="text-[9px] text-subtext mt-0.5">4 Matches • Econ 6.8</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. GEVENTS EXCLUSIVE TRUST STATS */}
      <section className="glass-panel rounded-2xl p-8 border border-white/10 shadow-lg grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/5">
        <div className="space-y-1">
          <span className="text-4xl font-black font-display text-accent block tracking-tight drop-shadow-[0_2px_8px_rgba(57,255,20,0.15)]">50+</span>
          <span className="text-[10px] uppercase tracking-widest text-subtext font-black">Corporate Cups Hosted</span>
        </div>
        <div className="space-y-1 pt-6 sm:pt-0">
          <span className="text-4xl font-black font-display text-accent block tracking-tight drop-shadow-[0_2px_8px_rgba(57,255,20,0.15)]">200+</span>
          <span className="text-[10px] uppercase tracking-widest text-subtext font-black">Registered Enterprise Teams</span>
        </div>
        <div className="space-y-1 pt-6 sm:pt-0">
          <span className="text-4xl font-black font-display text-accent block tracking-tight drop-shadow-[0_2px_8px_rgba(57,255,20,0.15)]">5,000+</span>
          <span className="text-[10px] uppercase tracking-widest text-subtext font-black">Active Player Rosters</span>
        </div>
      </section>

      {/* 6. TRUSTED SPONSOR GALLEYS */}
      <section className="space-y-4 pb-4">
        <h4 className="text-center text-[10px] uppercase tracking-widest text-white/40 font-black">
          Trusted by Industry Giants
        </h4>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-35 grayscale hover:grayscale-0 hover:opacity-75 transition-all duration-300">
          <span className="font-display font-black text-lg md:text-xl text-text hover:text-white transition-colors cursor-default">GOOGLE</span>
          <span className="font-display font-black text-lg md:text-xl text-text hover:text-white transition-colors cursor-default">MICROSOFT</span>
          <span className="font-display font-black text-lg md:text-xl text-text hover:text-white transition-colors cursor-default">AMAZON</span>
          <span className="font-display font-black text-lg md:text-xl text-text hover:text-white transition-colors cursor-default">META</span>
          <span className="font-display font-black text-lg md:text-xl text-text hover:text-white transition-colors cursor-default">ADOBE</span>
        </div>
      </section>
      
    </div>
  );
}
