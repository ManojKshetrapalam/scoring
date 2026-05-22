"use client";

import Link from "next/link";
import { Scale, ShieldAlert, Award, FileSpreadsheet, ChevronRight, HelpCircle } from "lucide-react";

export default function TermsOfService() {
  return (
    <article className="max-w-4xl mx-auto space-y-8 animate-fade-in" aria-labelledby="terms-heading">
      
      {/* HEADER SECTION */}
      <header className="text-center space-y-4 pb-6 border-b border-border">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-accent bg-opacity-10 text-accent mb-2">
          <Scale className="w-10 h-10" />
        </div>
        <h1 id="terms-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
          Terms of Service
        </h1>
        <p className="text-subtext text-sm max-w-xl mx-auto">
          Effective Date: May 22, 2026. Please review our corporate tournament booking terms, code of conduct, and refund guidelines.
        </p>
      </header>

      {/* QUICK RULES GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Key Terms Highlight">
        <div className="glass-panel p-6 rounded-xl flex items-start gap-4">
          <Award className="w-6 h-6 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text">Player Eligibility</h2>
            <p className="text-xs text-subtext">Active corporate employees with valid ID verification cards.</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-xl flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text">Code of Conduct</h2>
            <p className="text-xs text-subtext">Strict zero-tolerance policy for verbal abuse or violence.</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-xl flex items-start gap-4">
          <FileSpreadsheet className="w-6 h-6 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text">Rain Out Policy</h2>
            <p className="text-xs text-subtext">Pro-rata point splits or rescheduled fixtures for inclement weather.</p>
          </div>
        </div>
      </section>

      {/* TERMS BODY */}
      <section className="space-y-8 text-text text-sm sm:text-base leading-relaxed">
        
        {/* SECTION 1: CORPORATE REGISTRATIONS */}
        <div className="glass-panel p-6 sm:p-8 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <ChevronRight className="w-5 h-5 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">1. Corporate Team Bookings & Registrations</h2>
          </div>
          <p className="text-subtext">
            By registering a team on the <strong>Gevents Unlimited Cricket Portal</strong>, the registering manager represents that they are authorized to commit their organization to the scheduled brackets. 
          </p>
          <ul className="list-disc pl-5 space-y-2 text-subtext">
            <li><strong>Roster Completion:</strong> Final squads containing 11 active players and up to 4 substitutes must be registered at least 72 hours before the first scheduled match.</li>
            <li><strong>ID Authenticity:</strong> All squad members must be full-time staff of the corporate entity registered. Guest players must meet the strict rules set by the Super Admin during tournament creation.</li>
          </ul>
        </div>

        {/* SECTION 2: TOURNAMENT RULES & MATCH FORMATS */}
        <div className="glass-panel p-6 sm:p-8 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <ChevronRight className="w-5 h-5 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">2. Tournament Formats & Match Play</h2>
          </div>
          <p className="text-subtext">
            Gevents Unlimited operates multiple match formats: <em>Leather Ball, Box Turf, Indoor, and Box Cricket</em>. Each has discrete rules:
          </p>
          <p className="text-subtext">
            All players must be equipped with verified corporate safety kits. Box Turf and Indoor formats follow standard under-arm/over-arm configurations as updated by the match scorer. Any disputes on field decisions must be directed to the official umpire, whose judgment is absolute.
          </p>
        </div>

        {/* SECTION 3: PAYMENTS, CANCELLATION & REFUNDS */}
        <div className="glass-panel p-6 sm:p-8 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <ChevronRight className="w-5 h-5 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">3. Payments, Cancellations & Refunds</h2>
          </div>
          <p className="text-subtext">
            Tournament booking fees must be settled in full to secure brackets placement. Our cancellation fee matrix is structured as follows:
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border border-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-card text-text border-b border-border">
                  <th className="px-4 py-2 text-left">Timeframe</th>
                  <th className="px-4 py-2 text-left">Refund Terms</th>
                </tr>
              </thead>
              <tbody className="text-subtext divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-semibold text-text">&gt; 15 Days Before Start</td>
                  <td className="px-4 py-3">80% Refund of registration deposit</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-text">7 to 14 Days Before Start</td>
                  <td className="px-4 py-3">50% Refund of registration deposit</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-text">&lt; 7 Days Before Start</td>
                  <td className="px-4 py-3 text-accent font-semibold">No Refund (Venue bookings completed)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-subtext italic">
            * Weather Disruption: In the event of persistent rain (Leather Ball) or turf flooding, Gevents will make reasonable attempts to reschedule the matches. If rescheduling is impossible, point shares or pro-rata fee adjustments are allocated.
          </p>
        </div>

        {/* SECTION 4: INTELLECTUAL PROPERTY & STATS RIGHTS */}
        <div className="glass-panel p-6 sm:p-8 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <ChevronRight className="w-5 h-5 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">4. Live Scoring Intellectual Property</h2>
          </div>
          <p className="text-subtext">
            All ball-by-ball commentary records, player profiles, statistics, leaderboard tables, orange/purple cap metrics, and video highlights broadcasted through our frontend or mobile applications remain the intellectual property of <strong>Gevents Unlimited</strong>. 
          </p>
          <p className="text-subtext">
            Unauthorized scraping of live stats for betting indices or non-approved platforms is strictly prohibited.
          </p>
        </div>

        {/* SECTION 5: ACCOUNT SECURITY & SYSTEM ABUSE */}
        <div className="glass-panel p-6 sm:p-8 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <ChevronRight className="w-5 h-5 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">5. Scorer Console Security & System Abuse</h2>
          </div>
          <p className="text-subtext">
            Match scoring panels are reserved exclusively for Gevents-certified scorers. Attempting to reverse-engineer JWT configurations, injecting artificial runs, mimicking server sockets, or executing DoS attacks will result in immediate disqualification of the associated corporate team and legal actions.
          </p>
        </div>

      </section>

      {/* FOOTER ACTION */}
      <footer className="text-center pt-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-bold text-accent hover:text-accent-hover transition-colors focus-visible:outline"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Return to Dashboard Home</span>
        </Link>
      </footer>
    </article>
  );
}
