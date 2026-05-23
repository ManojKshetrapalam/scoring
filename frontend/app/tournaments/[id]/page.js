"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Crown, MapPin, ShieldCheck, Trophy, Users, X } from "lucide-react";
import { fetchApi } from "../../../lib/api";
import PastMatchList from "../../../components/PastMatchList";

export default function TournamentDetails({ params }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [standings, setStandings] = useState({ pointsTable: [], orangeCap: [], purpleCap: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamDetail, setTeamDetail] = useState(null);
  const [teamDetailLoading, setTeamDetailLoading] = useState(false);
  const [teamDetailError, setTeamDetailError] = useState("");

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

  useEffect(() => {
    if (!selectedTeamId || !params.id) {
      setTeamDetail(null);
      return;
    }

    let active = true;
    setTeamDetailLoading(true);
    setTeamDetailError("");

    fetchApi(`/tournaments/${params.id}/teams/${selectedTeamId}`)
      .then((res) => {
        if (!active) return;
        setTeamDetail(res.data);
      })
      .catch((err) => {
        if (!active) return;
        setTeamDetailError(err.message || "Failed to load team.");
        setTeamDetail(null);
      })
      .finally(() => {
        if (active) setTeamDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedTeamId, params.id]);

  const liveFixture = fixtures.find((fixture) => fixture.status === "live");

  function closeTeamDetail() {
    setSelectedTeamId(null);
    setTeamDetail(null);
    setTeamDetailError("");
  }

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
          { id: "schedule", label: "Schedule & Scores" },
          { id: "played", label: "Matches" },
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
              <p className="text-[10px] text-subtext">Tap a team to view squad and roles.</p>

              {teams.length === 0 ? (
                <p className="text-xs text-subtext">No teams have been registered yet.</p>
              ) : (
                <div className="space-y-2">
                  {teams.map((team) => {
                    const isSelected = selectedTeamId === team.id;
                    return (
                      <button
                        key={team.id}
                        type="button"
                        onClick={() => setSelectedTeamId(team.id)}
                        className={`w-full text-left bg-background p-3 rounded-lg border transition-all text-xs ${
                          isSelected
                            ? "border-accent ring-1 ring-accent/40"
                            : "border-border hover:border-accent/40"
                        }`}
                      >
                        <div className="flex justify-between items-center gap-2">
                          <div>
                            <p className="font-bold text-text">{team.name}</p>
                            <span className="text-[10px] text-subtext">{team.company_name}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-accent font-bold block">
                              {team.player_count ?? 0} players
                            </span>
                            <span className="text-[10px] text-subtext">{team.jersey_color || "—"}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedTeamId && (
                <div className="mt-4 border-t border-border pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-accent uppercase tracking-wider">
                      Team Details
                    </h4>
                    <button
                      type="button"
                      onClick={closeTeamDetail}
                      className="p-1 rounded border border-border text-subtext hover:text-text"
                      aria-label="Close team details"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {teamDetailLoading && (
                    <p className="text-xs text-subtext">Loading squad…</p>
                  )}
                  {teamDetailError && (
                    <p className="text-xs text-red-400">{teamDetailError}</p>
                  )}
                  {teamDetail && !teamDetailLoading && (
                    <TeamDetailPanel team={teamDetail} />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "played" && (
          <PastMatchList
            tournamentId={Number(params.id)}
            title="Tournament matches"
          />
        )}

        {activeTab === "schedule" && (
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
                          {fixture.team1_name && fixture.team2_name
                            ? `${fixture.team1_name} vs ${fixture.team2_name}`
                            : `Fixture #${fixture.id}`}
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
                    <div className="text-right text-[10px] text-subtext">
                      <span className="font-bold text-orange-500 text-sm block">{stat.runs} runs</span>
                      <span>{stat.balls} balls · SR {stat.strikeRate}</span>
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
                    <div className="text-right text-[10px] text-subtext">
                      <span className="font-bold text-purple-500 text-sm block">{stat.wickets} wkts</span>
                      <span>Econ {stat.economy}</span>
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

function TeamDetailPanel({ team }) {
  const players = team.players || [];

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-background/60 border border-border rounded-lg p-2">
          <span className="text-[9px] uppercase text-subtext block">Company</span>
          <span className="font-bold text-text">{team.company_name}</span>
        </div>
        <div className="bg-background/60 border border-border rounded-lg p-2">
          <span className="text-[9px] uppercase text-subtext block">Jersey</span>
          <span className="font-bold text-text">{team.jersey_color || "Not set"}</span>
        </div>
        <div className="bg-background/60 border border-border rounded-lg p-2">
          <span className="text-[9px] uppercase text-subtext block">Status</span>
          <span className="font-bold text-text capitalize">{team.status}</span>
        </div>
        <div className="bg-background/60 border border-border rounded-lg p-2">
          <span className="text-[9px] uppercase text-subtext block">Squad size</span>
          <span className="font-bold text-text">{players.length}</span>
        </div>
      </div>

      <div>
        <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-subtext mb-1">
          Squad & tournament stats
        </h5>
        <p className="text-[9px] text-subtext mb-2">
          Batting and bowling figures from matches in this tournament (same data as Orange / Purple Cap).
        </p>
        {players.length === 0 ? (
          <p className="text-subtext">No players registered for this team yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-background/80 text-[9px] uppercase text-subtext font-extrabold tracking-wider border-b border-border">
                  <th className="py-2 px-2 w-8">#</th>
                  <th className="py-2 px-2">Name</th>
                  <th className="py-2 px-2">Role</th>
                  <th className="py-2 px-2 text-right text-orange-500">Runs</th>
                  <th className="py-2 px-2 text-center text-orange-500">Balls</th>
                  <th className="py-2 px-2 text-right text-orange-500">SR</th>
                  <th className="py-2 px-2 text-center text-purple-500">Wkts</th>
                  <th className="py-2 px-2 text-center text-purple-500">Overs</th>
                  <th className="py-2 px-2 text-right text-purple-500">Econ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {players.map((player) => {
                  const bat = player.battingStats || {};
                  const bowl = player.bowlingStats || {};
                  const hasBat = (bat.runs || 0) > 0 || (bat.balls || 0) > 0;
                  const hasBowl = (bowl.wickets || 0) > 0 || (bowl.legalBalls || 0) > 0;

                  return (
                  <tr key={player.id} className="bg-background/30">
                    <td className="py-2 px-2 font-bold text-subtext">
                      {player.jersey_number ?? "—"}
                    </td>
                    <td className="py-2 px-2 font-bold text-text">{player.name}</td>
                    <td className="py-2 px-2">
                      <div className="flex flex-wrap gap-1">
                        {player.is_captain && (
                          <span className="inline-flex items-center gap-0.5 bg-accent/20 text-accent text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                            <Crown className="w-3 h-3" />
                            C
                          </span>
                        )}
                        {player.is_vice_captain && (
                          <span className="bg-background border border-border text-[9px] font-bold uppercase px-1.5 py-0.5 rounded text-subtext">
                            VC
                          </span>
                        )}
                        {player.is_wicket_keeper && (
                          <span className="inline-flex items-center gap-0.5 bg-blue-500/15 text-blue-400 text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3" />
                            WK
                          </span>
                        )}
                        {!player.is_captain && !player.is_vice_captain && !player.is_wicket_keeper && (
                          <span className="text-[9px] text-subtext">—</span>
                        )}
                      </div>
                    </td>
                    <td className={`py-2 px-2 text-right font-bold ${hasBat ? "text-orange-500" : "text-subtext"}`}>
                      {hasBat ? bat.runs : "—"}
                    </td>
                    <td className={`py-2 px-2 text-center ${hasBat ? "text-text" : "text-subtext"}`}>
                      {hasBat ? bat.balls : "—"}
                    </td>
                    <td className={`py-2 px-2 text-right ${hasBat ? "text-text" : "text-subtext"}`}>
                      {hasBat ? bat.strikeRate.toFixed(2) : "—"}
                    </td>
                    <td className={`py-2 px-2 text-center font-bold ${hasBowl ? "text-purple-500" : "text-subtext"}`}>
                      {hasBowl ? bowl.wickets : "—"}
                    </td>
                    <td className={`py-2 px-2 text-center ${hasBowl ? "text-text" : "text-subtext"}`}>
                      {hasBowl ? bowl.overs : "—"}
                    </td>
                    <td className={`py-2 px-2 text-right ${hasBowl ? "text-text" : "text-subtext"}`}>
                      {hasBowl ? bowl.economy.toFixed(2) : "—"}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
