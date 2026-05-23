"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { fetchApi, fetchAuthorizedApi } from "../../lib/api";
import {
  buildEmptyTeam,
  resizeTeamRoster,
  serializeTeamForApi,
  TeamRosterEditor,
  TournamentFormFields,
  FriendlyFormFields,
  ScheduleMatchFields,
} from "../../components/scorer/ScorerForms";

const SCORER_PHONE = "6360200382";

export default function ScorerDashboard() {
  const router = useRouter();
  const [phone, setPhone] = useState(SCORER_PHONE);
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [tournaments, setTournaments] = useState([]);
  const [friendlies, setFriendlies] = useState([]);
  const [tournamentFixtures, setTournamentFixtures] = useState([]);
  const [view, setView] = useState("list");
  const [editingTournament, setEditingTournament] = useState(null);
  const [editingFriendly, setEditingFriendly] = useState(null);
  const [scheduleTournamentId, setScheduleTournamentId] = useState("");
  const [scheduleTournamentLocked, setScheduleTournamentLocked] = useState(false);
  const [fixtureForm, setFixtureForm] = useState({
    matchDate: "",
    ground: "",
    team1: buildEmptyTeam("A"),
    team2: buildEmptyTeam("B"),
  });

  const [tournamentForm, setTournamentForm] = useState({
    name: "",
    type: "leather_ball",
    prizeMoney: "",
    startDate: "",
    endDate: "",
    groundName: "",
    address: "",
    overs: 20,
    playersPerTeam: 11,
  });

  const [friendlyForm, setFriendlyForm] = useState({
    title: "",
    matchDate: "",
    ground: "",
    overs: 20,
    playersPerTeam: 11,
    team1: buildEmptyTeam("A"),
    team2: buildEmptyTeam("B"),
  });

  const loadWorkspace = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetchAuthorizedApi("/scorer/workspace", token);
      setTournaments(res.data?.tournaments || []);
      setFriendlies(res.data?.friendlies || []);
      setTournamentFixtures(res.data?.tournamentFixtures || []);
    } catch (err) {
      setError(err.message || "Failed to load workspace.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("scorer-token");
    const savedUser = window.localStorage.getItem("scorer-user");
    if (savedToken) setToken(savedToken);
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (token) loadWorkspace();
  }, [token, loadWorkspace]);

  useEffect(() => {
    if (!token || typeof window === "undefined") return;
    if (window.location.hash !== "#tournaments") return;
    const el = document.getElementById("scorer-tournaments");
    if (el) {
      requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }, [token, view, tournaments.length]);

  useEffect(() => {
    if (view !== "friendly" || editingFriendly) return;
    const size = Number(friendlyForm.playersPerTeam) || 11;
    setFriendlyForm((current) => ({
      ...current,
      team1: resizeTeamRoster(current.team1, size),
      team2: resizeTeamRoster(current.team2, size),
    }));
  }, [friendlyForm.playersPerTeam, view, editingFriendly]);

  async function handleRequestOtp() {
    try {
      setLoading(true);
      setError("");
      await fetchApi("/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      setMessage("OTP sent. Use 1978 for the scorer account.");
    } catch (err) {
      setError(err.message || "Failed to request OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    try {
      setLoading(true);
      setError("");
      const result = await fetchApi("/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      window.localStorage.setItem("scorer-token", result.token);
      window.localStorage.setItem("scorer-user", JSON.stringify(result.user));
      window.dispatchEvent(new Event("scorer-auth-changed"));
      setToken(result.token);
      setUser(result.user);
      setMessage("Welcome back.");
    } catch (err) {
      setError(err.message || "Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function saveTournament(event) {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      const body = {
        ...tournamentForm,
        prizeMoney: Number(tournamentForm.prizeMoney || 0),
        overs: Number(tournamentForm.overs) || 20,
        playersPerTeam: Number(tournamentForm.playersPerTeam) || 11,
      };
      if (editingTournament) {
        await fetchAuthorizedApi(`/tournaments/${editingTournament.id}`, token, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        setMessage("Tournament updated.");
      } else {
        await fetchAuthorizedApi("/tournaments", token, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        setMessage("Tournament created.");
      }
      setView("list");
      setEditingTournament(null);
      await loadWorkspace();
    } catch (err) {
      setError(err.message || "Failed to save tournament.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteTournament(id) {
    if (!window.confirm("Delete this tournament and all its data?")) return;
    try {
      setLoading(true);
      await fetchAuthorizedApi(`/tournaments/${id}`, token, { method: "DELETE" });
      setMessage("Tournament deleted.");
      await loadWorkspace();
    } catch (err) {
      setError(err.message || "Failed to delete tournament.");
    } finally {
      setLoading(false);
    }
  }

  async function saveFriendly(event) {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      const payload = {
        title: friendlyForm.title,
        matchDate: friendlyForm.matchDate,
        ground: friendlyForm.ground,
        overs: friendlyForm.overs,
        playersPerTeam: friendlyForm.playersPerTeam,
        team1: serializeTeamForApi(friendlyForm.team1),
        team2: serializeTeamForApi(friendlyForm.team2),
      };

      if (editingFriendly) {
        await fetchAuthorizedApi(`/friendlies/${editingFriendly.id}`, token, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: payload.title,
            matchDate: payload.matchDate,
            ground: payload.ground,
            overs: payload.overs,
          }),
        });
        setMessage("Friendly match updated.");
      } else {
        const res = await fetchAuthorizedApi("/friendlies", token, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setMessage("Friendly match created.");
        if (res.data?.fixture?.id) {
          router.push(`/scorer/match/${res.data.fixture.id}`);
        }
      }
      setView("list");
      setEditingFriendly(null);
      await loadWorkspace();
    } catch (err) {
      setError(err.message || "Failed to save friendly match.");
    } finally {
      setLoading(false);
    }
  }

  async function scheduleTournamentFixture(event) {
    event.preventDefault();
    if (!scheduleTournamentId) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetchAuthorizedApi(`/tournaments/${scheduleTournamentId}/fixtures`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchDate: fixtureForm.matchDate,
          ground: fixtureForm.ground,
          team1: serializeTeamForApi(fixtureForm.team1),
          team2: serializeTeamForApi(fixtureForm.team2),
        }),
      });
      setMessage("Tournament match scheduled.");
      setScheduleTournamentLocked(false);
      setView("list");
      await loadWorkspace();
      if (res.data?.fixture?.id) {
        router.push(`/scorer/match/${res.data.fixture.id}`);
      }
    } catch (err) {
      setError(err.message || "Failed to schedule match.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteFriendly(id) {
    if (!window.confirm("Delete this friendly match?")) return;
    try {
      setLoading(true);
      await fetchAuthorizedApi(`/friendlies/${id}`, token, { method: "DELETE" });
      setMessage("Friendly match deleted.");
      await loadWorkspace();
    } catch (err) {
      setError(err.message || "Failed to delete friendly match.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <section className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-lg mx-auto">
        <div className="flex items-center gap-2 text-accent font-extrabold text-xs uppercase tracking-widest">
          <Sparkles className="w-4 h-4" />
          Scorer Login
        </div>
        <p className="text-sm text-subtext">Sign in to manage tournaments and score matches.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-2 text-xs font-bold uppercase text-subtext">
            Mobile
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-sm"
            />
          </label>
          <label className="space-y-2 text-xs font-bold uppercase text-subtext">
            OTP
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="1978"
              className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-sm"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleRequestOtp} disabled={loading} className="flex-1 border border-border py-3 rounded-lg font-bold text-sm">
            Request OTP
          </button>
          <button type="button" onClick={handleVerifyOtp} disabled={loading} className="flex-1 bg-accent text-black font-black py-3 rounded-lg">
            Sign In
          </button>
        </div>
        <p className="text-xs text-subtext flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-accent" />
          Scorer: 6360200382 · OTP 1978
        </p>
        {message && <p className="text-sm text-accent">{message}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-extrabold font-display">Scorer Dashboard</h1>
        <p className="text-sm text-subtext">{user?.name || "Official Scorer"}</p>
      </header>

      {message && (
        <div className="bg-[#1C3A27] border border-[#276F43] rounded-xl p-3 text-sm text-accent flex gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {message}
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {view === "list" && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingTournament(null);
                setTournamentForm({ name: "", type: "leather_ball", prizeMoney: "", startDate: "", endDate: "", groundName: "", address: "", overs: 20, playersPerTeam: 11 });
                setView("tournament");
              }}
              className="bg-accent text-black font-black px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Tournament
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingFriendly(null);
                setFriendlyForm({
                  title: "",
                  matchDate: "",
                  ground: "",
                  overs: 20,
                  playersPerTeam: 11,
                  team1: buildEmptyTeam("A", 11),
                  team2: buildEmptyTeam("B", 11),
                });
                setView("friendly");
              }}
              className="border border-accent text-accent font-black px-4 py-2 rounded-lg text-sm flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              New Friendly Match
            </button>
          </div>

          <section id="scorer-tournaments" className="space-y-4 scroll-mt-36">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-accent flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Tournaments
            </h2>
            {loading && <p className="text-sm text-subtext">Loading…</p>}
            <div className="grid gap-3">
              {tournaments.map((t) => (
                <article key={t.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-text">{t.name}</h3>
                    <p className="text-xs text-subtext mt-1">
                      {t.status} · {t.fixture_count ?? 0} matches · {t.team_count ?? 0} teams
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTournament(t);
                        setTournamentForm({
                          name: t.name,
                          type: t.type,
                          prizeMoney: String(t.prize_money || ""),
                          startDate: t.start_date?.slice(0, 10) || "",
                          endDate: t.end_date?.slice(0, 10) || "",
                          groundName: t.venue_details?.ground_name || "",
                          address: t.venue_details?.address || "",
                          overs: t.rules?.overs || 20,
                          playersPerTeam: t.rules?.players_per_team || 11,
                        });
                        setView("tournament");
                      }}
                      className="border border-border p-2 rounded-lg"
                      aria-label="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => deleteTournament(t.id)} className="border border-red-500/40 text-red-400 p-2 rounded-lg" aria-label="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const squadSize = Number(t.rules?.players_per_team || 11);
                        setScheduleTournamentId(String(t.id));
                        setScheduleTournamentLocked(true);
                        setFixtureForm({
                          matchDate: "",
                          ground: t.venue_details?.ground_name || "",
                          team1: buildEmptyTeam("A", squadSize),
                          team2: buildEmptyTeam("B", squadSize),
                        });
                        setView("schedule");
                      }}
                      className="text-xs font-bold text-accent px-3 py-2 border border-border rounded-lg"
                    >
                      + Match
                    </button>
                  </div>
                </article>
              ))}
              {!loading && tournaments.length === 0 && (
                <p className="text-sm text-subtext">No tournaments yet.</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-accent flex items-center gap-2">
              <Users className="w-4 h-4" />
              Friendly Matches
            </h2>
            <div className="grid gap-3">
              {friendlies.map((f) => (
                <article key={f.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-text">
                      {f.title || `${f.team1_name} vs ${f.team2_name}`}
                    </h3>
                    <p className="text-xs text-subtext mt-1">
                      {f.team1_name} vs {f.team2_name} · {f.ground} · {f.live_status || f.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFriendly(f);
                        setFriendlyForm({
                          title: f.title || "",
                          matchDate: f.match_date?.slice(0, 16) || "",
                          ground: f.ground || "",
                          overs: f.overs_limit || 20,
                          playersPerTeam: 11,
                          team1: buildEmptyTeam("A"),
                          team2: buildEmptyTeam("B"),
                        });
                        setView("friendly");
                      }}
                      className="border border-border p-2 rounded-lg"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => deleteFriendly(f.id)} className="border border-red-500/40 text-red-400 p-2 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <Link
                      href={`/scorer/match/${f.id}`}
                      className="bg-accent text-black font-black text-xs px-4 py-2 rounded-lg"
                    >
                      Score
                    </Link>
                  </div>
                </article>
              ))}
              {!loading && friendlies.length === 0 && (
                <p className="text-sm text-subtext">No friendly matches yet.</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-subtext">Tournament Matches</h2>
            <div className="grid gap-3">
              {tournamentFixtures.map((f) => (
                <article key={f.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] text-accent font-bold uppercase">{f.tournament_name}</p>
                    <h3 className="font-extrabold text-text">
                      {f.team1_name} vs {f.team2_name}
                    </h3>
                    <p className="text-xs text-subtext">{f.ground} · {f.live_status || f.status}</p>
                  </div>
                  <Link href={`/scorer/match/${f.id}`} className="bg-accent text-black font-black text-xs px-4 py-2 rounded-lg text-center">
                    Score
                  </Link>
                </article>
              ))}
              {tournamentFixtures.length === 0 && (
                <p className="text-sm text-subtext">No tournament matches scheduled yet.</p>
              )}
            </div>
          </section>
        </>
      )}

      {view === "tournament" && (
        <form onSubmit={saveTournament} className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-2xl">
          <h2 className="font-extrabold">{editingTournament ? "Edit Tournament" : "Create Tournament"}</h2>
          <TournamentFormFields form={tournamentForm} setForm={setTournamentForm} />
          <div className="flex gap-2">
            <button type="button" onClick={() => setView("list")} className="flex-1 border border-border py-3 rounded-lg font-bold">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-accent text-black font-black py-3 rounded-lg">
              Save
            </button>
          </div>
        </form>
      )}

      {view === "schedule" && (
        <form onSubmit={scheduleTournamentFixture} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-extrabold">Schedule Tournament Match</h2>
          <ScheduleMatchFields
            fixtureForm={fixtureForm}
            setFixtureForm={setFixtureForm}
            tournamentLocked={scheduleTournamentLocked}
            tournamentName={tournaments.find((t) => String(t.id) === scheduleTournamentId)?.name}
          />
          <TeamRosterEditor title="Team A" team={fixtureForm.team1} onChange={(team) => setFixtureForm((c) => ({ ...c, team1: team }))} />
          <TeamRosterEditor title="Team B" team={fixtureForm.team2} onChange={(team) => setFixtureForm((c) => ({ ...c, team2: team }))} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setScheduleTournamentLocked(false);
                setView("list");
              }}
              className="flex-1 border border-border py-3 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading || !scheduleTournamentId} className="flex-1 bg-accent text-black font-black py-3 rounded-lg">
              Schedule & Score
            </button>
          </div>
        </form>
      )}

      {view === "friendly" && (
        <form onSubmit={saveFriendly} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-extrabold">{editingFriendly ? "Edit Friendly Match" : "Create Friendly Match"}</h2>
          <FriendlyFormFields form={friendlyForm} setForm={setFriendlyForm} isEdit={Boolean(editingFriendly)} />
          {!editingFriendly && (
            <>
              <TeamRosterEditor title="Team A" team={friendlyForm.team1} onChange={(team) => setFriendlyForm((c) => ({ ...c, team1: team }))} />
              <TeamRosterEditor title="Team B" team={friendlyForm.team2} onChange={(team) => setFriendlyForm((c) => ({ ...c, team2: team }))} />
            </>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setView("list")} className="flex-1 border border-border py-3 rounded-lg font-bold">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-accent text-black font-black py-3 rounded-lg">
              {editingFriendly ? "Update" : "Create & Score"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
