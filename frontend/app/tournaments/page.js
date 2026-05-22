"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Search, Trophy } from "lucide-react";
import { fetchApi } from "../../lib/api";

export default function TournamentsDirectory() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTournaments() {
      try {
        setLoading(true);
        setError("");
        const result = await fetchApi("/tournaments");
        if (active) {
          setTournaments(result.data || []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load tournaments.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTournaments();
    return () => {
      active = false;
    };
  }, []);

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesFilter = filter === "all" || tournament.status === filter;
    const venue = `${tournament.venue_details?.ground_name || ""} ${tournament.venue_details?.address || ""}`.toLowerCase();
    const matchesSearch = tournament.name.toLowerCase().includes(search.toLowerCase()) || venue.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-accent font-extrabold text-xs uppercase tracking-widest">
          <Trophy className="w-4 h-4" />
          Championships Directory
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">Gevents Cricket Tournaments</h1>
        <p className="text-subtext text-xs sm:text-sm max-w-2xl leading-relaxed">
          Browse the real tournament records currently available in the system.
        </p>
      </div>

      <div className="bg-card border border-border p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
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

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {[
            { value: "all", label: "All Statuses" },
            { value: "active", label: "Active" },
            { value: "completed", label: "Completed" },
            { value: "draft", label: "Draft" },
          ].map((button) => (
            <button
              key={button.value}
              onClick={() => setFilter(button.value)}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all border whitespace-nowrap focus-visible:outline ${filter === button.value ? "bg-accent border-accent text-black" : "bg-background border-border text-subtext hover:text-text"}`}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="bg-card border border-border rounded-2xl p-6 text-sm text-subtext">Loading tournaments...</div>}
      {!loading && error && <div className="bg-card border border-red-500/30 rounded-2xl p-6 text-sm text-red-400">{error}</div>}
      {!loading && !error && filteredTournaments.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 text-sm text-subtext">No tournaments matched your filters.</div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {filteredTournaments.map((tournament) => (
          <div key={tournament.id} className="bg-card border border-border rounded-2xl p-6 hover:border-accent transition-all duration-300 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-0.5 rounded font-extrabold uppercase text-[9px] bg-[#1C3A27] text-accent border border-[#276F43]">
                  {tournament.status}
                </span>
                <span className="text-accent uppercase font-bold tracking-wider text-[9px]">
                  {String(tournament.type).replaceAll("_", " ")}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{tournament.name}</h2>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-subtext pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-accent" />
                  {tournament.start_date || "Start date TBD"}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-accent" />
                  {tournament.venue_details?.ground_name || "Venue TBD"}
                </span>
              </div>
            </div>

            <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-border pt-4 md:pt-0 gap-4">
              <div className="text-left md:text-right">
                <span className="text-xs text-subtext uppercase">Grand Prize</span>
                <p className="text-lg font-black text-accent">
                  {tournament.prize_money ? `₹${Number(tournament.prize_money).toLocaleString("en-IN")}` : "TBD"}
                </p>
              </div>

              <div className="flex gap-2">
                <Link href={`/tournaments/${tournament.id}`} className="bg-background hover:bg-opacity-80 border border-border text-text font-bold text-xs px-4 py-2 rounded-lg transition-all focus-visible:outline">
                  View Details
                </Link>
                {tournament.status === "active" && (
                  <Link href={`/register?tournamentId=${tournament.id}`} className="bg-accent hover:bg-accent-hover text-black font-extrabold text-xs px-4 py-2 rounded-lg transition-all focus-visible:outline">
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
