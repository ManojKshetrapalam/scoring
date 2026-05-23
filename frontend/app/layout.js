"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon, Sparkles, PhoneCall, LogOut } from "lucide-react";
import Logo from "../components/Logo";
import "./globals.css";

export default function RootLayout({ children }) {
  const [theme, setTheme] = useState("dark");
  const [scorerLoggedIn, setScorerLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const refreshScorerAuth = useCallback(() => {
    setScorerLoggedIn(Boolean(window.localStorage.getItem("scorer-token")));
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("gevents-theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  useEffect(() => {
    refreshScorerAuth();
    window.addEventListener("storage", refreshScorerAuth);
    window.addEventListener("scorer-auth-changed", refreshScorerAuth);
    return () => {
      window.removeEventListener("storage", refreshScorerAuth);
      window.removeEventListener("scorer-auth-changed", refreshScorerAuth);
    };
  }, [pathname, refreshScorerAuth]);

  function handleScorerLogout() {
    window.localStorage.removeItem("scorer-token");
    window.localStorage.removeItem("scorer-user");
    window.dispatchEvent(new Event("scorer-auth-changed"));
    setScorerLoggedIn(false);
    router.push("/scorer");
  }

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("gevents-theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const homeHref = scorerLoggedIn ? "/scorer" : "/";
  const homeLabel = scorerLoggedIn ? "Scorer Dashboard" : "Gevents Cricket Home";
  const tournamentsHref = scorerLoggedIn ? "/scorer#tournaments" : "/tournaments";

  return (
    <html lang="en">
      <head>
        <title>Gevents Unlimited Cricket - Corporate Tournament Management Ecosystem</title>
        <meta name="description" content="Next-generation professional sports portal for corporate Box, Turf, Indoor, and Leather Ball cricket tournaments. Live scores, team management, and match highlights by Gevents Unlimited." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="https://geventsunlimited.com/frontend/images/favicon.svg" />
      </head>
      <body className="flex flex-col min-h-screen">
        {/* SEMANTIC HEADER AND NAVIGATION BANNER */}
        <header className="sticky top-0 z-50 glass-panel border-b border-border transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              {/* BRAND LOGO */}
              <div className="flex items-center">
                <Link href={homeHref} className="flex items-center focus-visible:outline" aria-label={homeLabel}>
                  <Logo className="h-8 w-auto text-text hover:text-accent transition-colors" />
                </Link>
              </div>

              {/* NAVIGATION MENU */}
              <nav className="hidden md:flex space-x-8 items-center" aria-label="Primary Navigation">
                <Link href={homeHref} className="text-text hover:text-accent font-medium text-sm transition-colors focus-visible:outline">
                  Home
                </Link>
                <Link href={tournamentsHref} className="text-text hover:text-accent font-medium text-sm transition-colors focus-visible:outline">
                  Tournaments
                </Link>
                {/* <Link href="/teams" className="text-text hover:text-accent font-medium text-sm transition-colors focus-visible:outline">
                  Teams
                </Link> */}
                <Link href="/past-matches" className="text-text hover:text-accent font-medium text-sm transition-colors focus-visible:outline">
                  Past Matches
                </Link>
                {/* <Link href="/scorer" className="text-text hover:text-accent font-medium text-sm transition-colors focus-visible:outline flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Scorer Panel
                </Link> */}
              </nav>

              {/* PHONE AND THEME ACTIONS */}
              <div className="flex items-center gap-3">
                <a 
                  href="tel:+919403890373" 
                  className="hidden lg:flex items-center gap-2 bg-card hover:bg-opacity-80 border border-border px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide text-text transition-all focus-visible:outline"
                  aria-label="Call support: +91 940 38 903 73"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-accent animate-pulse" />
                  <span>+91 940 38 903 73</span>
                </a>

                <button 
                  onClick={toggleTheme}
                  className="w-9 h-9 rounded-full bg-card hover:bg-opacity-80 border border-border flex items-center justify-center text-text transition-all hover:scale-105 active:scale-95 focus-visible:outline"
                  aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 text-accent" />
                  ) : (
                    <Moon className="w-4 h-4 text-text" />
                  )}
                </button>

                {scorerLoggedIn ? (
                  <button
                    type="button"
                    onClick={handleScorerLogout}
                    className="bg-card hover:bg-background border border-border text-text font-bold text-xs sm:text-sm px-4 py-2 rounded-lg transition-all flex items-center gap-2 focus-visible:outline"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/scorer"
                    className="bg-accent hover:bg-accent-hover text-black font-bold text-xs sm:text-sm px-4 py-2 rounded-lg transition-all transform hover:translate-y-[-1px] focus-visible:outline flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Scorer Panel
                  </Link>
                )}
              </div>

            </div>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main id="main-content" className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* MANDATORY REGULATORY POLICY FOOTER (Google AdSense Standard Compliance) */}
        <footer className="bg-card border-t border-border transition-colors duration-300 py-12" id="footer">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              
              {/* BRAND BRIEF */}
              <div className="space-y-4">
                <Link href="/" className="inline-block focus-visible:outline" aria-label="Gevents Cricket Home">
                  <Logo className="h-7 w-auto text-text hover:text-accent transition-colors" />
                </Link>
                <p className="text-subtext text-xs leading-relaxed max-w-sm">
                  We are India's premier online booking and corporate event execution platform. Providing dynamic stage, sound, lighting, live streaming, and high-fidelity corporate cricket league management.
                </p>
              </div>

              {/* CORPORATE SERVICES */}
              <div>
                <h2 className="text-text font-semibold text-sm uppercase tracking-wider mb-4">
                  Match Formats
                </h2>
                <ul className="space-y-2 text-xs text-subtext">
                  <li><span className="hover:text-accent">Leather Ball Cricket Cup</span></li>
                  <li><span className="hover:text-accent">Corporate Turf Box Leagues</span></li>
                  <li><span className="hover:text-accent">Indoor Arena Cricket Matches</span></li>
                  <li><span className="hover:text-accent">Exhibition Corporate Matches</span></li>
                </ul>
              </div>

              {/* ACCESS LINKS */}
              <div>
                <h2 className="text-text font-semibold text-sm uppercase tracking-wider mb-4">
                  Quick Access
                </h2>
                <ul className="space-y-2 text-xs">
                  <li>
                    <Link href="/tournaments" className="text-subtext hover:text-accent transition-colors">
                      Tournaments Directory
                    </Link>
                  </li>
                  <li>
                    <Link href="/teams" className="text-subtext hover:text-accent transition-colors">
                      Teams Directory
                    </Link>
                  </li>
                  <li>
                    <Link href="/past-matches" className="text-subtext hover:text-accent transition-colors">
                      Past Matches
                    </Link>
                  </li>
                  <li>
                    <Link href="/scorer" className="text-subtext hover:text-accent transition-colors">
                      Scorer Console
                    </Link>
                  </li>
                </ul>
              </div>

              {/* COMPLIANCE LINKS (AdSense Publisher Standards User Global 5) */}
              <div>
                <h2 className="text-text font-semibold text-sm uppercase tracking-wider mb-4" id="compliance-pages">
                  Terms & Regulatory
                </h2>
                <ul className="space-y-2 text-xs">
                  <li>
                    <Link href="/about" className="text-subtext hover:text-accent transition-colors">
                      About Gevents
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-subtext hover:text-accent transition-colors">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-subtext hover:text-accent transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-subtext hover:text-accent transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>

            </div>

            <div className="border-t border-border mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-subtext gap-4">
              <span>
                © {new Date().getFullYear()} Gevents Unlimited. All rights reserved.
              </span>
              <div className="flex gap-4">
                <span className="hover:text-accent">Official Publisher Account</span>
                <span className="hover:text-accent">AdSense Approved Site</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
