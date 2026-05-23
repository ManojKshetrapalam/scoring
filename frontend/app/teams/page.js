"use client";

import { useEffect, useState } from "react";
import { Users, Building2, Trophy } from "lucide-react";
import { fetchApi } from "../../lib/api";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchApi("/teams")
      .then((res) => setTeams(res.data || []))
      .catch((err) => setError(err.message || "Failed to load teams."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-accent font-extrabold text-xs uppercase tracking-widest">
          <Users className="w-4 h-4" />
          Registered Teams
        </div>
        <h1 className="text-3xl font-extrabold font-display tracking-tight">Teams</h1>
        <p className="text-sm text-subtext">
          All corporate teams registered with Gevents Unlimited Cricket across our tournaments.
        </p>
      </header>

      {loading && <p className="text-sm text-subtext">Loading teams…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {!loading && !error && teams.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-subtext text-sm">
          No teams registered yet.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map((team) => (
          <article
            key={team.id}
            className="bg-card border border-border rounded-xl p-5 space-y-3 hover:border-accent/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-text">{team.name}</h2>
                <p className="text-xs text-subtext flex items-center gap-1.5 mt-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {team.company_name}
                </p>
              </div>
              <span
                className={`text-[10px] font-black uppercase px-2 py-1 rounded ${
                  team.status === "approved"
                    ? "bg-accent/15 text-accent"
                    : "bg-background border border-border text-subtext"
                }`}
              >
                {team.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-subtext">
              {team.tournament_name ? (
                <span className="flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-accent" />
                  {team.tournament_name}
                </span>
              ) : (
                <span className="text-accent/80">Friendly / standalone</span>
              )}
              <span>{team.player_count ?? 0} players</span>
              {team.jersey_color && <span>Jersey: {team.jersey_color}</span>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
