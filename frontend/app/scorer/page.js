"use client";

import { useState, useEffect } from "react";
import { Sparkles, RotateCcw, UserPlus, ShieldAlert, Award, Play } from "lucide-react";

const isProd = typeof window !== "undefined" && process.env.NODE_ENV === "production";
const apiBase = isProd ? "/scoring/api" : "http://localhost:5001/api";

export default function ScorerPanel() {
  const [matchState, setMatchState] = useState({
    team1Name: "Google Giants",
    team2Name: "Microsoft Mavericks",
    current_innings: 1,
    current_over: 14,
    current_ball: 2,
    striker_id: 101,
    non_striker_id: 102,
    bowler_id: 205,
    team1_score: { runs: 122, wickets: 4, overs: 14.2, extras: 8 },
    team2_score: { runs: 0, wickets: 0, overs: 0.0, extras: 0 },
    strikerName: "Virat Kohli",
    nonStrikerName: "Rohit Sharma",
    bowlerName: "Mitchell Starc"
  });

  const [wicketDrawerOpen, setWicketDrawerOpen] = useState(false);
  const [extraDrawerOpen, setExtraDrawerOpen] = useState(false);
  const [activeExtraType, setActiveExtraType] = useState(null); // wide, noball, bye, legbye

  const postScoreUpdate = async (runs, extraRuns, extraType, wicketType) => {
    // 1. Prepare payload
    const payload = {
      runs,
      extraRuns: extraRuns || 0,
      extraType: extraType || null,
      wicketType: wicketType || null,
      batsmanId: matchState.striker_id,
      bowlerId: matchState.bowler_id
    };

    // 2. Perform optimistic state calculation for instant user feedback
    setMatchState(prev => {
      const isFirst = prev.current_innings === 1;
      const score = isFirst ? { ...prev.team1_score } : { ...prev.team2_score };

      if (extraType === "wide" || extraType === "noball") {
        score.runs += (runs || 0) + (extraRuns || 1);
        score.extras += (extraRuns || 1);
      } else {
        score.runs += (runs || 0) + (extraRuns || 0);
        if (extraType === "bye" || extraType === "legbye") {
          score.extras += (extraRuns || 0);
        }

        // Increment balls
        let nextBall = prev.current_ball + 1;
        let nextOver = prev.current_over;
        if (nextBall >= 6) {
          nextOver += 1;
          nextBall = 0;
        }
        prev.current_ball = nextBall;
        prev.current_over = nextOver;
      }

      if (wicketType) {
        score.wickets += 1;
      }

      score.overs = parseFloat(`${prev.current_over}.${prev.current_ball}`);

      return {
        ...prev,
        team1_score: isFirst ? score : prev.team1_score,
        team2_score: !isFirst ? score : prev.team2_score
      };
    });

    // 3. Make HTTP request to actual backend if running
    try {
      const res = await fetch(`${apiBase}/matches/1/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        console.log("Real-time score broadcast confirmed by API server:", data.matchState);
      }
    } catch (e) {
      console.warn("Backend server not running. Running in standalone high-fidelity visual simulator mode.");
    }
  };

  const handleRunTap = (runs) => {
    postScoreUpdate(runs, 0, null, null);
  };

  const handleExtraTap = (type) => {
    setActiveExtraType(type);
    setExtraDrawerOpen(true);
  };

  const submitExtra = (extraRuns) => {
    postScoreUpdate(0, extraRuns, activeExtraType, null);
    setExtraDrawerOpen(false);
    setActiveExtraType(null);
  };

  const submitWicket = (type) => {
    postScoreUpdate(0, 0, null, type);
    setWicketDrawerOpen(false);
  };

  const handleUndo = async () => {
    try {
      const res = await fetch(`${apiBase}/matches/1/undo`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setMatchState(prev => ({
          ...prev,
          current_over: data.matchState.current_over,
          current_ball: data.matchState.current_ball,
          team1_score: data.matchState.team1_score,
          team2_score: data.matchState.team2_score
        }));
      }
    } catch (e) {
      // Standalone fallback decrement
      setMatchState(prev => {
        const isFirst = prev.current_innings === 1;
        const score = isFirst ? { ...prev.team1_score } : { ...prev.team2_score };

        if (prev.current_ball === 0) {
          if (prev.current_over > 0) {
            prev.current_over -= 1;
            prev.current_ball = 5;
          }
        } else {
          prev.current_ball -= 1;
        }

        score.overs = parseFloat(`${prev.current_over}.${prev.current_ball}`);

        return {
          ...prev,
          team1_score: isFirst ? score : prev.team1_score,
          team2_score: !isFirst ? score : prev.team2_score
        };
      });
    }
  };

  const activeScore = matchState.current_innings === 1 ? matchState.team1_score : matchState.team2_score;

  return (
    <div className="max-w-md mx-auto space-y-6">
      
      {/* 1. SCORER HEADER */}
      <div className="bg-card border border-border p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent animate-pulse" />
          <div>
            <h1 className="font-extrabold text-sm uppercase">Gevents Scorer Deck</h1>
            <span className="text-[9px] text-subtext uppercase">Authorized Match Scorer</span>
          </div>
        </div>
        <button 
          onClick={handleUndo}
          className="bg-background border border-border px-3 py-1.5 rounded-lg text-xs font-bold text-subtext hover:text-text flex items-center gap-1 focus-visible:outline"
          aria-label="Undo last ball action"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Undo
        </button>
      </div>

      {/* 2. MAIN REAL-TIME CARD DISPLAY */}
      <div className="glass-panel border border-border p-6 rounded-2xl text-center space-y-4">
        <div>
          <span className="text-xs text-subtext uppercase font-bold tracking-wider">
            {matchState.current_innings === 1 ? matchState.team1Name : matchState.team2Name} is Batting
          </span>
          <h2 className="text-5xl font-black font-display text-accent mt-2">
            {activeScore.runs} - {activeScore.wickets}
          </h2>
          <p className="text-sm text-subtext mt-1">
            Over: <span className="font-bold text-text">{activeScore.overs}</span> (Target: Open)
          </p>
        </div>

        <div className="border-t border-border/40 pt-4 grid grid-cols-2 text-xs text-subtext">
          <div className="border-r border-border/40">
            <span className="text-[10px] uppercase block">Striker</span>
            <span className="font-bold text-text text-sm">{matchState.strikerName}*</span>
            <span className="block text-[10px] mt-0.5">{Math.round(activeScore.runs * 0.4)} runs • 34 balls</span>
          </div>
          <div>
            <span className="text-[10px] uppercase block">Active Bowler</span>
            <span className="font-bold text-text text-sm">{matchState.bowlerName}</span>
            <span className="block text-[10px] mt-0.5">3.2 overs • 1/19</span>
          </div>
        </div>
      </div>

      {/* 3. SCORING INTERACTION BUTTONS */}
      <div className="space-y-4">
        
        {/* Run scoring buttons grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { runs: 0, label: "Dot Ball" },
            { runs: 1, label: "1 Run" },
            { runs: 2, label: "2 Runs" },
            { runs: 3, label: "3 Runs" },
            { runs: 4, label: "FOUR!" },
            { runs: 6, label: "SIX!" }
          ].map((btn) => (
            <button
              key={btn.runs}
              onClick={() => handleRunTap(btn.runs)}
              className="bg-card hover:bg-background border border-border py-4 rounded-xl font-black text-lg text-text active:scale-95 transition-all focus-visible:outline"
            >
              {btn.runs === 0 ? "•" : btn.runs}
              <span className="block text-[9px] font-bold text-subtext uppercase tracking-wider mt-0.5">
                {btn.label}
              </span>
            </button>
          ))}
        </div>

        {/* Extras & Wicket Triggers */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setWicketDrawerOpen(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all focus-visible:outline"
          >
            Out / Wicket
          </button>
          <button
            onClick={() => setExtraDrawerOpen(true)}
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-text border border-border font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all focus-visible:outline"
          >
            Extras / Pen
          </button>
        </div>

      </div>

      {/* WICKET MODAL DRAWERS */}
      {wicketDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="bg-card border border-red-600 max-w-sm w-full rounded-2xl p-5 space-y-4">
            <h3 className="text-center font-bold text-base text-red-500 uppercase tracking-wider">Select Wicket Dismissal</h3>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              {["bowled", "caught", "runout", "lbw", "stumped", "retired_out"].map((w) => (
                <button
                  key={w}
                  onClick={() => submitWicket(w)}
                  className="bg-background border border-border p-3 rounded-lg font-bold text-text uppercase hover:border-red-500"
                >
                  {w.replace("_", " ")}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setWicketDrawerOpen(false)}
              className="w-full text-center text-xs text-subtext hover:text-text"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* EXTRAS MODAL DRAWERS */}
      {extraDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-sm w-full rounded-2xl p-5 space-y-4">
            {!activeExtraType ? (
              <>
                <h3 className="text-center font-bold text-base uppercase tracking-wider">Select Extra Type</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {["wide", "noball", "bye", "legbye"].map((ext) => (
                    <button
                      key={ext}
                      onClick={() => handleExtraTap(ext)}
                      className="bg-background border border-border p-3 rounded-lg font-bold text-text uppercase hover:border-accent"
                    >
                      {ext}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-center font-bold text-base uppercase tracking-wider">Runs Added via {activeExtraType}</h3>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[1, 2, 3, 4].map((r) => (
                    <button
                      key={r}
                      onClick={() => submitExtra(r)}
                      className="bg-background border border-border p-3 rounded-lg font-black text-text text-sm hover:border-accent"
                    >
                      +{r}
                    </button>
                  ))}
                </div>
              </>
            )}

            <button 
              onClick={() => {
                setExtraDrawerOpen(false);
                setActiveExtraType(null);
              }}
              className="w-full text-center text-xs text-subtext hover:text-text"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
