"use client";

import Link from "next/link";
import { ShieldCheck, Eye, Database, FileText, ChevronRight, Lock } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <article className="max-w-4xl mx-auto space-y-8 animate-fade-in" aria-labelledby="privacy-heading">
      
      {/* HEADER SECTION */}
      <header className="text-center space-y-4 pb-6 border-b border-border">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-accent bg-opacity-10 text-accent mb-2">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 id="privacy-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
          Privacy Policy
        </h1>
        <p className="text-subtext text-sm max-w-xl mx-auto">
          Last Updated: May 22, 2026. Learn how Gevents Unlimited collects, protects, and handles your data under regulatory compliance.
        </p>
      </header>

      {/* QUICK STATS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Privacy Highlights">
        <div className="glass-panel p-6 rounded-xl flex items-start gap-4">
          <Lock className="w-6 h-6 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text">Secure Data</h2>
            <p className="text-xs text-subtext">All registrations and payments are encrypted end-to-end.</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-xl flex items-start gap-4">
          <Eye className="w-6 h-6 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text">Transparency</h2>
            <p className="text-xs text-subtext">We never sell your details or rosters to third-party brokers.</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-xl flex items-start gap-4">
          <Database className="w-6 h-6 text-accent shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-text">Opt-Out</h2>
            <p className="text-xs text-subtext">Manage cookie preferences or request account purging easily.</p>
          </div>
        </div>
      </section>

      {/* POLICY TEXT BODY */}
      <section className="space-y-8 text-text text-sm sm:text-base leading-relaxed">
        
        {/* SECTION 1: INTRODUCTION */}
        <div className="glass-panel p-6 sm:p-8 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <ChevronRight className="w-5 h-5 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">1. Introduction & Overview</h2>
          </div>
          <p className="text-subtext">
            Welcome to <strong>Gevents Unlimited Cricket</strong>. We operate India's premier corporate cricket event execution platform. This Privacy Policy outlines how Gevents Unlimited ("we", "our", or "us") gathers, stores, processes, and protects your information when you visit our website, register for corporate leagues, or interact with our scorer boards.
          </p>
          <p className="text-subtext">
            By utilizing our responsive booking website or registered live scorer applications, you consent to the data structures detailed within this document.
          </p>
        </div>

        {/* SECTION 2: INFORMATION WE COLLECT */}
        <div className="glass-panel p-6 sm:p-8 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <ChevronRight className="w-5 h-5 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">2. Information We Collect</h2>
          </div>
          <p className="text-subtext">
            To provide efficient corporate tournament registrations, leaderboard placements, and customized notifications, we compile data divided into:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-subtext">
            <li>
              <strong>Account & Roster Data:</strong> Player names, company email addresses, manager contact numbers, uniform sizes, and playing profiles.
            </li>
            <li>
              <strong>Live Score Logs:</strong> Performance stats, strike rates, bowling analytics, and custom dynamic player Cap standings tracked by team scorers.
            </li>
            <li>
              <strong>Transaction Metadata:</strong> When registering, we gather payment IDs, invoices, and payment statuses. Actual payment credentials are never cached on our servers; they are securely parsed by UPI and Razorpay providers.
            </li>
            <li>
              <strong>Usage Analytics:</strong> Device IP addresses, browser specifications, operating system parameters, and system interaction durations collected automatically.
            </li>
          </ul>
        </div>

        {/* SECTION 3: ADSENSE & THIRD-PARTY COOKIES DISCLOSURE */}
        <div className="glass-panel p-6 sm:p-8 rounded-xl space-y-4 border border-accent border-opacity-20 bg-opacity-80">
          <div className="flex items-center gap-2 text-accent">
            <ChevronRight className="w-5 h-5 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">3. Google AdSense & Cookie Disclosures</h2>
          </div>
          <p className="text-subtext">
            This site uses <strong>Google AdSense</strong> to display advertisements. Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to Gevents Unlimited Cricket or other websites on the internet.
          </p>
          <p className="text-subtext">
            Google's use of advertising cookies enables it and its partners to serve ads to our visitors based on their visit to this platform and/or other sites on the Internet.
          </p>
          <div className="bg-card p-4 rounded-lg border border-border text-xs text-subtext space-y-2">
            <p className="font-semibold text-text">Opting Out of Personalized Advertising:</p>
            <p>
              Users may opt out of personalized advertising by visiting{" "}
              <a 
                href="https://www.google.com/settings/ads" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-accent hover:underline inline-flex items-center gap-0.5 focus-visible:outline"
              >
                Google Ads Settings
              </a>. Alternatively, you can opt out of a third-party vendor's use of cookies for personalized advertising by visiting{" "}
              <a 
                href="https://www.aboutads.info" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-accent hover:underline inline-flex items-center gap-0.5 focus-visible:outline"
              >
                www.aboutads.info
              </a>.
            </p>
          </div>
        </div>

        {/* SECTION 4: DATA PROTECTION AND STORAGE */}
        <div className="glass-panel p-6 sm:p-8 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <ChevronRight className="w-5 h-5 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">4. Data Security</h2>
          </div>
          <p className="text-subtext">
            All database pipelines are routed through SSL/TLS secure environments. Access to match scorer modules, tournament schedules, and database nodes is protected by robust JWT (JSON Web Tokens) verification.
          </p>
          <p className="text-subtext">
            We store files and records for as long as necessary to host the specific corporate tournament bracket. You may demand immediate correction or removal of your player stats or company account records by emailing our customer team.
          </p>
        </div>

        {/* SECTION 5: CONTACT INFORMATION */}
        <div className="glass-panel p-6 sm:p-8 rounded-xl space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <ChevronRight className="w-5 h-5 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">5. Contact and Queries</h2>
          </div>
          <p className="text-subtext">
            If you have questions regarding this Privacy Policy, cookie usage, or AdSense compliance policies, contact us directly:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-card rounded-lg border border-border">
              <span className="block text-xs text-subtext font-semibold uppercase">Email Support</span>
              <a href="mailto:info@geventsunlimited.com" className="text-accent font-bold hover:underline focus-visible:outline">
                info@geventsunlimited.com
              </a>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border">
              <span className="block text-xs text-subtext font-semibold uppercase">Call Hotline</span>
              <a href="tel:+919403890373" className="text-accent font-bold hover:underline focus-visible:outline">
                +91 940 38 903 73
              </a>
            </div>
          </div>
        </div>

      </section>

      {/* FOOTER ACTION */}
      <footer className="text-center pt-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-bold text-accent hover:text-accent-hover transition-colors focus-visible:outline"
        >
          <FileText className="w-4 h-4" />
          <span>Return to Dashboard Home</span>
        </Link>
      </footer>
    </article>
  );
}
