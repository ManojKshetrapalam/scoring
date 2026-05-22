"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, Calendar, MapPin, Search, Filter } from "lucide-react";

export default function TournamentsDirectory() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const tournaments = [
    {
      id: 1,
      name: "Gevents Corporate Cricket Cup 2026",
      type: "leather_ball",
      status: "active",
      prize: "₹1,00,000",
      start: "June 12, 2026",
      venue: "Kharadi Stadium, Pune",
      slots: "12/16 Slots Filled",
      desc: "Multi-national corporate championship played with professional leather ball rules on grass grounds."
    },
    {
      id: 2,
      name: "Baner Corporate Turf Box League",
      type: "turf_cricket",
      status: "active",
      prize: "₹50,000",
      start: "July 05, 2026",
      venue: "Gevents Turf Park, Baner",
      slots: "6/8 Slots Filled",
      desc: "Fast-paced, high-intensity 8-a-side box cricket matches inside state-of-the-art turf netting."
    },
    {
      id: 3,
      name: "Gevents Indoor Corporate Clash 2025",
      type: "indoor_cricket",
      status: "completed",
      prize: "₹40,000",
      start: "December 15, 2025",
      venue: "Gevents Indoor Arena, Hinjewadi",
      slots: "Completed",
      desc: "Indoor corporate cricket tournament featuring double-run walls, quick-fire match plays, and continuous actions."
    }
  ];

  const filteredTournaments = tournaments.filter(t => {
    const matchesFilter = filter === "all" || t.status === filter;
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                          t.venue.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-accent font-extrabold text-xs uppercase tracking-widest">
          <Trophy className="w-4 h-4" />
          Championships Directory
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">
          Gevents Cricket Tournaments
        </h1>
        <p className="text-subtext text-xs sm:text-sm max-w-2xl leading-relaxed">
          Discover all upcoming, live, and completed corporate championships managed by Gevents Unlimited. Register your team to compete with Pune's top industry teams.
        </p>
      </div>

      {/* FILTER SEARCH PANEL */}
      <div className="bg-card border border-border p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-subtext absolute left-3 top-3" />
          <input 
            type="text" 
            placeholder="Search by tournament name or venue..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border pl-10 pr-4 py-2 rounded-lg text-xs text-text placeholder-subtext focus-visible:outline"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {[
            { value: "all", label: "All Formats" },
            { value: "active", label: "Active & Upcoming" },
            { value: "completed", label: "Completed Leagues" }
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all border whitespace-nowrap focus-visible:outline ${filter === btn.value ? "bg-accent border-accent text-black" : "bg-background border-border text-subtext hover:text-text"}`}
            >
              {btn.label}
            </button>
          ))}
        </div>

      </div>

      {/* TOURNAMENTS LIST */}
      <div className="grid grid-cols-1 gap-6">
        {filteredTournaments.map((t) => (
          <div key={t.id} className="bg-card border border-border rounded-2xl p-6 hover:border-accent transition-all duration-300 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            
            {/* Left Content */}
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`px-3 py-0.5 rounded font-extrabold uppercase text-[9px] ${t.status === "active" ? "bg-[#1C3A27] text-accent border border-[#276F43]" : "bg-neutral-800 text-subtext"}`}>
                  {t.status === "active" ? "Active" : "Completed"}
                </span>
                <span className="text-subtext">•</span>
                <span className="text-accent uppercase font-bold tracking-wider text-[9px]">
                  {t.type.replace("_", " ")}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {t.name}
              </h2>
              
              <p className="text-xs text-subtext leading-relaxed">
                {t.desc}
              </p>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-subtext pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-accent" />
                  {t.start}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-accent" />
                  {t.venue}
                </span>
              </div>
            </div>

            {/* Right Action */}
            <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-border pt-4 md:pt-0 gap-4">
              <div className="text-left md:text-right">
                <span className="text-xs text-subtext uppercase">Grand Prize</span>
                <p className="text-lg font-black text-accent">{t.prize}</p>
                <span className="text-[10px] text-subtext">{t.slots}</span>
              </div>

              <div className="flex gap-2">
                <Link 
                  href={`/tournaments/${t.id}`} 
                  className="bg-background hover:bg-opacity-80 border border-border text-text font-bold text-xs px-4 py-2 rounded-lg transition-all focus-visible:outline"
                >
                  View Details
                </Link>
                {t.status === "active" && (
                  <Link 
                    href="/register" 
                    className="bg-accent hover:bg-accent-hover text-black font-extrabold text-xs px-4 py-2 rounded-lg transition-all focus-visible:outline"
                  >
                    Register Team
                  </Link>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
