"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, Calendar, MapPin, Users, Award, ShieldCheck, Play } from "lucide-react";

export default function TournamentDetails({ params }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock tournament loaded based on route ID
  const isBoxCricket = params.id === "2";
  const name = isBoxCricket ? "Baner Corporate Turf Box League" : "Gevents Corporate Cricket Cup 2026";
  const prize = isBoxCricket ? "₹50,000" : "₹1,00,000";
  const venue = isBoxCricket ? "Gevents Turf Park, Baner" : "Kharadi Stadium, Pune";
  const format = isBoxCricket ? "Turf Box (8-a-side)" : "Leather Ball (11-a-side)";

  return (
    <div className="space-y-8">
      
      {/* 1. TOP HEADER SUMMARY */}
      <section className="bg-gradient-to-br from-card to-background border border-border p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#1C3A27] text-accent text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            Active Bracket
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">{name}</h1>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-subtext">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-accent" /> June - July 2026</span>
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-accent" /> {venue}</span>
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-accent" /> {format}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-background/50 border border-border p-4 rounded-xl">
          <div className="text-right">
            <span className="text-subtext text-[10px] uppercase block">Grand Prize</span>
            <span className="text-xl font-black text-accent block">{prize}</span>
            <span className="text-[10px] text-accent uppercase font-bold tracking-wider">AdSense Verified</span>
          </div>
        </div>
      </section>

      {/* 2. DYNAMIC CONTROLLERS - TABS */}
      <div className="flex border-b border-border overflow-x-auto gap-2">
        {[
          { id: "overview", label: "Overview & Rules" },
          { id: "teams", label: "Teams & Standings" },
          { id: "matches", label: "Schedule & Scores" },
          { id: "stats", label: "Cap Leaderboards" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-xs sm:text-sm font-extrabold px-6 py-3 border-b-2 transition-all whitespace-nowrap focus-visible:outline ${activeTab === tab.id ? "border-accent text-accent bg-card/25" : "border-transparent text-subtext hover:text-text"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. TAB PANELS CONTENT */}
      <div className="min-h-[400px]">

        {/* OVERVIEW & RULES */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold font-display">League Description</h3>
                <p className="text-xs text-subtext leading-relaxed">
                  Join Gevents Unlimited for Pune's most anticipated corporate sports event. Bringing together industry professionals for a competitive yet extremely friendly cricket championship. We maintain certified umpires, high-definition camera set-ups with instant replay, custom team jerseys, and full real-time ball-by-ball updates.
                </p>
              </div>

              <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold font-display flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                  Customized Match Rules
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-background p-3 rounded-lg border border-border">
                    <span className="text-subtext uppercase text-[9px] block">Overs & Powerplays</span>
                    <span className="font-bold text-text">{isBoxCricket ? "8 Overs per Side (2 Over Powerplay)" : "20 Overs per Side (6 Over Powerplay)"}</span>
                  </div>
                  <div className="bg-background p-3 rounded-lg border border-border">
                    <span className="text-subtext uppercase text-[9px] block">Wide / No-ball Cost</span>
                    <span className="font-bold text-text">{isBoxCricket ? "+2 Runs and Extra Ball" : "+1 Run and Free Hit"}</span>
                  </div>
                  <div className="bg-background p-3 rounded-lg border border-border">
                    <span className="text-subtext uppercase text-[9px] block">Roster Limits</span>
                    <span className="font-bold text-text">{isBoxCricket ? "8 Active Players (Max 12 Registered)" : "11 Active Players (Max 16 Registered)"}</span>
                  </div>
                  <div className="bg-background p-3 rounded-lg border border-border">
                    <span className="text-subtext uppercase text-[9px] block">Tie-breaker Logic</span>
                    <span className="font-bold text-text">One Over Eliminator (Super Over)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Side Sponsors & Venue */}
            <div className="space-y-6">
              <div className="bg-card border border-border p-6 rounded-2xl space-y-3">
                <h3 className="font-bold font-display text-sm uppercase text-accent tracking-wider">Tournament Sponsors</h3>
                <div className="space-y-4 pt-2">
                  <div className="p-4 bg-background border border-border rounded-lg text-center font-black tracking-widest text-text">
                    GEVENTS UNLIMITED
                  </div>
                  <div className="p-4 bg-background border border-border rounded-lg text-center font-black tracking-widest text-text opacity-60">
                    ADOBE CORP
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEAMS & STANDINGS */}
        {activeTab === "teams" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Points Table */}
            <div className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold font-display">Standings Points Table</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-subtext uppercase text-[10px] font-extrabold tracking-wider">
                      <th className="py-3">Team Name</th>
                      <th className="py-3 text-center">Played</th>
                      <th className="py-3 text-center">Won</th>
                      <th className="py-3 text-center">Lost</th>
                      <th className="py-3 text-center">NRR</th>
                      <th className="py-3 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-medium">
                    {[
                      { name: "Google Giants", p: 4, w: 3, l: 1, nrr: "+1.450", pts: 6 },
                      { name: "Microsoft Mavericks", p: 4, w: 2, l: 2, nrr: "+0.320", pts: 4 },
                      { name: "Meta Masters", p: 4, w: 1, l: 3, nrr: "-0.840", pts: 2 }
                    ].map((row, i) => (
                      <tr key={i}>
                        <td className="py-3 font-bold">{row.name}</td>
                        <td className="py-3 text-center text-subtext">{row.p}</td>
                        <td className="py-3 text-center">{row.w}</td>
                        <td className="py-3 text-center">{row.l}</td>
                        <td className="py-3 text-center text-accent">{row.nrr}</td>
                        <td className="py-3 text-right font-black text-accent">{row.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Teams Roster list */}
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold font-display">Registered Teams</h3>
              
              <div className="space-y-3">
                {[
                  { name: "Google Giants", company: "Google Inc.", color: "Navy/Yellow" },
                  { name: "Microsoft Mavericks", company: "Microsoft Corp.", color: "Teal/White" },
                  { name: "Meta Masters", company: "Meta Platforms", color: "Blue/Silver" }
                ].map((team, idx) => (
                  <div key={idx} className="bg-background p-3 rounded-lg border border-border flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-text">{team.name}</p>
                      <span className="text-[10px] text-subtext">{team.company}</span>
                    </div>
                    <span className="text-[10px] text-subtext">{team.color}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* SCHEDULE & SCORES */}
        {activeTab === "matches" && (
          <div className="space-y-6">
            
            {/* Live match indicator */}
            <div className="bg-card border border-accent/30 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute right-4 top-4 flex items-center gap-1.5 bg-[#1C3A27] px-3 py-1 rounded text-accent font-black text-[10px] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-accent live-radar" />
                Live Now
              </div>

              <div className="space-y-4">
                <span className="text-xs text-subtext block">Match 1 • Gevents Arena A</span>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-lg font-extrabold">Google Giants</h4>
                    <p className="text-xs text-subtext">vs Microsoft Mavericks</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-accent">122/4</span>
                    <p className="text-xs text-subtext">14.2 Overs</p>
                  </div>
                </div>
                
                <div className="border-t border-border/40 pt-4 flex justify-between items-center">
                  <span className="text-xs text-subtext">Striker: Virat Kohli 52* (34)</span>
                  <Link href="/" className="bg-accent hover:bg-accent-hover text-black text-xs font-bold px-4 py-2 rounded-lg transition-all focus-visible:outline">
                    Match Center
                  </Link>
                </div>
              </div>
            </div>

            {/* Upcoming fixture schedules */}
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold font-display">Match Schedules & Fixtures</h3>
              
              <div className="space-y-3">
                {[
                  { id: 2, t1: "Meta Masters", t2: "Microsoft Mavericks", date: "June 23, 2026 • 09:30 AM", ground: "Pitch B" },
                  { id: 3, t1: "Google Giants", t2: "Meta Masters", date: "June 25, 2026 • 02:30 PM", ground: "Main Pitch" }
                ].map((fix, idx) => (
                  <div key={idx} className="bg-background p-4 rounded-xl border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-3">
                    <div>
                      <span className="text-[10px] text-accent uppercase font-bold tracking-wider">Group Stage Match</span>
                      <p className="font-extrabold text-sm text-text pt-0.5">{fix.t1} vs {fix.t2}</p>
                      <span className="text-[10px] text-subtext">{fix.date} • {fix.ground}</span>
                    </div>
                    <span className="bg-card border border-border px-3 py-1.5 rounded text-[10px] text-subtext uppercase font-bold">
                      Scheduled
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* CAP LEADERBOARDS */}
        {activeTab === "stats" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Orange Cap list */}
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <div className="w-7 h-7 rounded bg-orange-500 flex items-center justify-center text-black font-extrabold text-xs">
                  O
                </div>
                <h3 className="font-extrabold font-display text-base text-orange-500 uppercase tracking-wider">Orange Cap (Most Runs)</h3>
              </div>

              <div className="divide-y divide-border/40 space-y-3">
                {[
                  { name: "Virat Kohli", team: "Google Giants", runs: 342, match: 4 },
                  { name: "Joe Root", team: "Microsoft Mavericks", runs: 284, match: 4 },
                  { name: "Rohit Sharma", team: "Google Giants", runs: 210, match: 4 }
                ].map((stat, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 text-xs">
                    <div>
                      <p className="font-bold text-text">{stat.name}</p>
                      <span className="text-[10px] text-subtext">{stat.team}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-orange-500 text-sm">{stat.runs} Runs</span>
                      <p className="text-[10px] text-subtext">{stat.match} Matches</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Purple Cap list */}
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <div className="w-7 h-7 rounded bg-purple-500 flex items-center justify-center text-white font-extrabold text-xs">
                  P
                </div>
                <h3 className="font-extrabold font-display text-base text-purple-500 uppercase tracking-wider">Purple Cap (Most Wickets)</h3>
              </div>

              <div className="divide-y divide-border/40 space-y-3">
                {[
                  { name: "Mitchell Starc", team: "Microsoft Mavericks", wickets: 11, match: 4 },
                  { name: "Jasprit Bumrah", team: "Google Giants", wickets: 9, match: 4 },
                  { name: "Ravindra Jadeja", team: "Google Giants", wickets: 6, match: 4 }
                ].map((stat, idx) => (
                  <div key={idx} className="flex justify-between items-center py-3 text-xs">
                    <div>
                      <p className="font-bold text-text">{stat.name}</p>
                      <span className="text-[10px] text-subtext">{stat.team}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-purple-500 text-sm">{stat.wickets} Wickets</span>
                      <p className="text-[10px] text-subtext">{stat.match} Matches</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
