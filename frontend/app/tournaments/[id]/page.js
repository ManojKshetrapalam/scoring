"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, ShieldCheck, Trophy, Users } from "lucide-react";
import { fetchApi } from "../../../lib/api";

export default function TournamentDetails({ params }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [standings, setStandings] = useState({ pointsTable: [], orangeCap: [], purpleCap: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTournament() {
      try {
        setLoading(true);
        setError("");

        const [tournamentRes, teamsRes, fixturesRes, standingsRes] = await Promise.all([
          fetchApi(`/tournaments/${params.id}`),
          fetchApi(`/tournaments/${params.id}/teams`),
          fetchApi(`/tournaments/${params.id}/fixtures`),
          fetchApi(`/tournaments/${params.id}/standings`),
        ]);

        if (!active) return;

        setTournament(tournamentRes.data);
        setTeams(teamsRes.data || []);
        setFixtures(fixturesRes.data || []);
        setStandings({
          pointsTable: standingsRes.pointsTable || [],
          orangeCap: standingsRes.orangeCap || [],
          purpleCap: standingsRes.purpleCap || [],
        });
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load tournament details.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTournament();
    return () => {
      active = false;
    };
  }, [params.id]);

  const liveFixture = fixtures.find((fixture) => fixture.status === "live");

  if (loading) {
    return <div className="bg-card border border-border rounded-2xl p-6 text-sm text-subtext">Loading tournament details...</div>;
  }

  if (error) {
    return <div className="bg-card border border-red-500/30 rounded-2xl p-6 text-sm text-red-400">{error}</div>;
  }

  if (!tournament) {
    return <div className="bg-card border border-border rounded-2xl p-6 text-sm text-subtext">Tournament not found.</div>;
  }

  return (
    <div className="space-y-8">
      <section className="bg-gradient-to-br from-card to-background border border-border p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#1C3A27] text-accent text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            {tournament.status}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display leading-tight">{tournament.name}</h1>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-subtext">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-accent" />
              {tournament.start_date || "Start date TBD"}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-accent" />
              {tournament.venue_details?.ground_name || "Venue TBD"}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-accent" />
              {String(tournament.type).replaceAll("_", " ")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-background/50 border border-border p-4 rounded-xl">
          <div className="text-right">
            <span className="text-subtext text-[10px] uppercase block">Grand Prize</span>
            <span className="text-xl font-black text-accent block">
              {tournament.prize_money ? `₹${Number(tournament.prize_money).toLocaleString("en-IN")}` : "TBD"}
            </span>
          </div>
        </div>
      </section>

      <div className="flex border-b border-border overflow-x-auto gap-2">
        {[
          { id: "overview", label: "Overview & Rules" },
          { id: "teams", label: "Teams & Standings" },
          { id: "matches", label: "Schedule & Scores" },
          { id: "stats", label: "Cap Leaderboards" },
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

      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold font-display">Tournament Overview</h3>
                <p className="text-xs text-subtext leading-relaxed">
                  This view is now fully driven by tournament records from the backend. Add venue, rule, and schedule details in the database to enrich this page.
                </p>
              </div>

              <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold font-display flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                  Tournament Rules
                </h3>

                {tournament.rules ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {Object.entries(tournament.rules).map(([key, value]) => (
                      <div key={key} className="bg-background p-3 rounded-lg border border-border">
                        <span className="text-subtext uppercase text-[9px] block">{key.replaceAll("_", " ")}</span>
                        <span className="font-bold text-text">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-subtext">No rules have been stored for this tournament yet.</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-card border border-border p-6 rounded-2xl space-y-3">
                <h3 className="font-bold font-display text-sm uppercase text-accent tracking-wider">Venue</h3>
                <p className="text-sm font-bold text-text">{tournament.venue_details?.ground_name || "Venue TBD"}</p>
                <p className="text-xs text-subtext">{tournament.venue_details?.address || "Address not available"}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "teams" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-card border border-border p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold font-display">Standings Points Table</h3>

              {standings.pointsTable.length === 0 ? (
                <p className="text-xs text-subtext">No standings data is available yet.</p>
              ) : (
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
                      {standings.pointsTable.map((row) => (
                        <tr key={row.teamId}>
                          <td className="py-3 font-bold">{row.teamName}</td>
                          <td className="py-3 text-center text-subtext">{row.played}</td>
                          <td className="py-3 text-center">{row.won}</td>
                          <td className="py-3 text-center">{row.lost}</td>
                          <td className="py-3 text-center text-accent">{row.nrr}</td>
                          <td className="py-3 text-right font-black text-accent">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold font-display">Registered Teams</h3>

              {teams.length === 0 ? (
                <p className="text-xs text-subtext">No teams have been registered yet.</p>
              ) : (
                <div className="space-y-3">
                  {teams.map((team) => (
                    <div key={team.id} className="bg-background p-3 rounded-lg border border-border flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-text">{team.name}</p>
                        <span className="text-[10px] text-subtext">{team.company_name}</span>
                      </div>
                      <span className="text-[10px] text-subtext">{team.jersey_color || "Not set"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "matches" && (
          <div className="space-y-6">
            {liveFixture && (
              <div className="bg-card border border-accent/30 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute right-4 top-4 flex items-center gap-1.5 bg-[#1C3A27] px-3 py-1 rounded text-accent font-black text-[10px] uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent live-radar" />
                  Live Now
                </div>

                <div className="space-y-4">
                  <span className="text-xs text-subtext block">{liveFixture.ground}</span>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-lg font-extrabold">Current live fixture</h4>
                      <p className="text-xs text-subtext">Open the live center to follow the score feed.</p>
                    </div>
                    <Link href="/" className="bg-accent hover:bg-accent-hover text-black text-xs font-bold px-4 py-2 rounded-lg transition-all focus-visible:outline">
                      Match Center
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold font-display">Match Schedules & Fixtures</h3>

              {fixtures.length === 0 ? (
                <p className="text-xs text-subtext">No fixtures have been scheduled yet.</p>
              ) : (
                <div className="space-y-3">
                  {fixtures.map((fixture) => (
                    <div key={fixture.id} className="bg-background p-4 rounded-xl border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-3">
                      <div>
                        <span className="text-[10px] text-accent uppercase font-bold tracking-wider">{fixture.status}</span>
                        <p className="font-extrabold text-sm text-text pt-0.5">
                          Fixture #{fixture.id}
                        </p>
                        <span className="text-[10px] text-subtext">{fixture.match_date} • {fixture.ground}</span>
                      </div>
                      <span className="bg-card border border-border px-3 py-1.5 rounded text-[10px] text-subtext uppercase font-bold">
                        {fixture.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <h3 className="font-extrabold font-display text-base text-orange-500 uppercase tracking-wider">Orange Cap</h3>
              {standings.orangeCap.length === 0 ? (
                <p className="text-xs text-subtext">No batting leaderboard data is available yet.</p>
              ) : (
                standings.orangeCap.map((stat, idx) => (
                  <div key={`${stat.name}-${idx}`} className="flex justify-between items-center py-3 text-xs border-t border-border/40 first:border-t-0 first:pt-0">
                    <div>
                      <p className="font-bold text-text">{stat.name}</p>
                      <span className="text-[10px] text-subtext">{stat.team}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-orange-500 text-sm">{stat.runs} Runs</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
              <h3 className="font-extrabold font-display text-base text-purple-500 uppercase tracking-wider">Purple Cap</h3>
              {standings.purpleCap.length === 0 ? (
                <p className="text-xs text-subtext">No bowling leaderboard data is available yet.</p>
              ) : (
                standings.purpleCap.map((stat, idx) => (
                  <div key={`${stat.name}-${idx}`} className="flex justify-between items-center py-3 text-xs border-t border-border/40 first:border-t-0 first:pt-0">
                    <div>
                      <p className="font-bold text-text">{stat.name}</p>
                      <span className="text-[10px] text-subtext">{stat.team}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-purple-500 text-sm">{stat.wickets} Wickets</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
