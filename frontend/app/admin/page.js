"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Trophy, Users } from "lucide-react";
import { fetchApi } from "../../lib/api";

export default function AdminConsole() {
  const [tournaments, setTournaments] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAdminData() {
      try {
        setLoading(true);
        setError("");

        const tournamentRes = await fetchApi("/tournaments");
        if (!active) return;

        const tournamentList = tournamentRes.data || [];
        setTournaments(tournamentList);

        const nestedResults = await Promise.all(
          tournamentList.map(async (tournament) => {
            const [teamsRes, fixturesRes] = await Promise.all([
              fetchApi(`/tournaments/${tournament.id}/teams`),
              fetchApi(`/tournaments/${tournament.id}/fixtures`),
            ]);

            return {
              teams: teamsRes.data || [],
              fixtures: fixturesRes.data || [],
            };
          }),
        );

        if (!active) return;

        setTeams(nestedResults.flatMap((result) => result.teams));
        setFixtures(nestedResults.flatMap((result) => result.fixtures));
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load admin dashboard.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAdminData();
    return () => {
      active = false;
    };
  }, []);

  const pendingRegistrations = useMemo(
    () => teams.filter((team) => team.status === "pending"),
    [teams],
  );

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold font-display tracking-tight">Super Admin Dashboard</h1>
        <p className="text-subtext text-xs sm:text-sm">
          This view now shows only real backend data. No simulated queues, fake schedules, or seeded admin cards remain here.
        </p>
      </div>

      {loading && <div className="bg-card border border-border rounded-2xl p-6 text-sm text-subtext">Loading dashboard...</div>}
      {!loading && error && <div className="bg-card border border-red-500/30 rounded-2xl p-6 text-sm text-red-400">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold font-display flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            Tournaments
          </h3>
          <p className="text-4xl font-black text-accent">{tournaments.length}</p>
          <p className="text-xs text-subtext">Total tournaments available in the backend.</p>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold font-display flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Pending Teams
          </h3>
          <p className="text-4xl font-black text-accent">{pendingRegistrations.length}</p>
          <p className="text-xs text-subtext">Team registrations still pending approval.</p>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold font-display flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            Fixtures
          </h3>
          <p className="text-4xl font-black text-accent">{fixtures.length}</p>
          <p className="text-xs text-subtext">Scheduled or live fixtures found in the backend.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold font-display">Pending Registration Queue</h3>
          {pendingRegistrations.length === 0 ? (
            <p className="text-xs text-subtext">No pending registrations right now.</p>
          ) : (
            <div className="space-y-3">
              {pendingRegistrations.map((team) => (
                <div key={team.id} className="bg-background border border-border p-4 rounded-xl text-xs">
                  <div className="font-extrabold text-sm text-text">{team.name}</div>
                  <p className="text-subtext mt-1">{team.company_name}</p>
                  <p className="text-[10px] text-subtext mt-2 uppercase">Status: {team.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold font-display">Fixture Calendar</h3>
          {fixtures.length === 0 ? (
            <p className="text-xs text-subtext">No fixtures have been scheduled yet.</p>
          ) : (
            <div className="space-y-3">
              {fixtures.map((fixture) => (
                <div key={fixture.id} className="bg-background p-4 rounded-xl border border-border text-xs flex justify-between gap-4">
                  <div>
                    <p className="font-bold text-text">Fixture #{fixture.id}</p>
                    <span className="text-[10px] text-subtext">{fixture.match_date} • {fixture.ground}</span>
                  </div>
                  <span className="text-[10px] text-accent uppercase font-bold">{fixture.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
