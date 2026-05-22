"use client";

import Link from "next/link";
import { Sparkles, Trophy, Users, ShieldAlert, Award, Calendar, Volume2, Video } from "lucide-react";

export default function AboutUs() {
  return (
    <article className="max-w-5xl mx-auto space-y-12 animate-fade-in" aria-labelledby="about-heading">
      
      {/* HERO SECTION */}
      <header className="text-center space-y-6 pb-8 border-b border-border">
        <span className="text-accent text-xs font-bold tracking-widest uppercase bg-accent bg-opacity-10 px-3 py-1.5 rounded-full">
          Who We Are
        </span>
        <h1 id="about-heading" className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text font-display">
          Elevating Corporate Sports <br className="hidden sm:inline" />
          <span className="text-accent">Beyond The Ordinary</span>
        </h1>
        <p className="text-subtext text-base max-w-2xl mx-auto leading-relaxed">
          Gevents Unlimited is India's leading corporate event execution and tournament management provider. We bring professional stadium-grade experiences to corporate sports leagues.
        </p>
      </header>

      {/* CORE CAPABILITIES GRID */}
      <section className="space-y-6" aria-labelledby="capabilities-heading">
        <h2 id="capabilities-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-text text-center">
          Stadium-Grade Event Execution
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-xl space-y-4">
            <div className="w-10 h-10 rounded-lg bg-accent bg-opacity-10 text-accent flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text">Pro Stage & Sound</h3>
            <p className="text-xs sm:text-sm text-subtext">
              High-decibel concert sound systems, premium LED screens, custom lighting configurations, and professional live commentators keeping the turf alive.
            </p>
          </div>
          <div className="glass-panel p-6 rounded-xl space-y-4">
            <div className="w-10 h-10 rounded-lg bg-accent bg-opacity-10 text-accent flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text">High-Fidelity Streams</h3>
            <p className="text-xs sm:text-sm text-subtext">
              Multi-camera broadcast crews, slow-motion drone replays, post-match highlight summaries, and live TV overlays matching international tournaments.
            </p>
          </div>
          <div className="glass-panel p-6 rounded-xl space-y-4">
            <div className="w-10 h-10 rounded-lg bg-accent bg-opacity-10 text-accent flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-text">Live Digital Hub</h3>
            <p className="text-xs sm:text-sm text-subtext">
              Our bespoke online ecosystem with under-2s Websocket live scoreboards, Orange/Purple Cap analytics, corporate registration pipelines, and admin fixture brackets.
            </p>
          </div>
        </div>
      </section>

      {/* MISSION AND STORY SECTION */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-secondary bg-opacity-30 p-8 rounded-2xl border border-border">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-text">
            Our Tournament Formats
          </h2>
          <p className="text-sm text-subtext leading-relaxed">
            Corporate life demands focus, collaboration, and high performance. We translate these values onto the field by organizing structured cricket tournaments tailored for corporate professionals.
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-subtext">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              <strong>Leather Ball Cricket Cups:</strong> Multi-day tournaments played on standard stadium pitches.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              <strong>Box & Turf Leagues:</strong> Fast-paced under-arm matches played on premium synthetic turf fields.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              <strong>Indoor Arena Leagues:</strong> Fully cushioned halls perfect for monsoon sessions or night matches.
            </li>
          </ul>
        </div>
        
        {/* GRAPHIC OR KEY STATISTICS */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel p-6 rounded-xl text-center space-y-2">
            <Users className="w-8 h-8 text-accent mx-auto" />
            <span className="block text-2xl font-black text-text font-display">120+</span>
            <span className="block text-[10px] sm:text-xs text-subtext uppercase tracking-wider font-semibold">Active Corporates</span>
          </div>
          <div className="glass-panel p-6 rounded-xl text-center space-y-2">
            <Trophy className="w-8 h-8 text-accent mx-auto" />
            <span className="block text-2xl font-black text-text font-display">45+</span>
            <span className="block text-[10px] sm:text-xs text-subtext uppercase tracking-wider font-semibold">Cups Staged</span>
          </div>
          <div className="glass-panel p-6 rounded-xl text-center space-y-2">
            <Calendar className="w-8 h-8 text-accent mx-auto" />
            <span className="block text-2xl font-black text-text font-display">5,000+</span>
            <span className="block text-[10px] sm:text-xs text-subtext uppercase tracking-wider font-semibold">Match Overs Stored</span>
          </div>
          <div className="glass-panel p-6 rounded-xl text-center space-y-2">
            <Award className="w-8 h-8 text-accent mx-auto" />
            <span className="block text-2xl font-black text-text font-display">99.8%</span>
            <span className="block text-[10px] sm:text-xs text-subtext uppercase tracking-wider font-semibold">Client Satisfaction</span>
          </div>
        </div>
      </section>

      {/* COMPLIANCE STATEMENTS */}
      <section className="glass-panel p-6 sm:p-8 rounded-xl text-center space-y-4">
        <h2 className="text-lg font-bold text-text">Licensed Sports Organizers</h2>
        <p className="text-xs sm:text-sm text-subtext max-w-3xl mx-auto">
          Gevents Unlimited operates under official registration numbers within state event compliance commissions. All venues, box turf spaces, sound channels, and tournament scorer accounts are fully verified. We stand for fair play, robust physical safety, and stellar digital tracking.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold text-accent pt-2">
          <span>✔ Registered Event Stagers</span>
          <span>✔ GST Compliant Invoicing</span>
          <span>✔ Google AdSense Premium Partner</span>
        </div>
      </section>

      {/* CTA ACTIONS */}
      <footer className="flex justify-center gap-4">
        <Link 
          href="/register" 
          className="bg-accent hover:bg-accent-hover text-black font-bold px-6 py-3 rounded-lg text-sm transition-all focus-visible:outline"
        >
          Register Your Team
        </Link>
        <Link 
          href="/contact" 
          className="bg-card hover:bg-opacity-8 border border-border text-text font-bold px-6 py-3 rounded-lg text-sm transition-all focus-visible:outline"
        >
          Contact Event Team
        </Link>
      </footer>
    </article>
  );
}
