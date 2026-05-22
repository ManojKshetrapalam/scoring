"use client";

import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserPlus,
} from "lucide-react";
import { fetchApi, fetchAuthorizedApi, socketPath, socketUrl } from "../../lib/api";
import { formatStrikeRate } from "../../lib/scorecard";

const SCORER_PHONE = "6360200382";

function buildEmptyPlayer(index) {
  return {
    name: "",
    jerseyNumber: index + 1,
    battingStyle: "",
    bowlingStyle: "",
    isCaptain: index === 0,
    isWicketKeeper: index === 0,
  };
}

function buildEmptyTeam(prefix) {
  return {
    name: "",
    companyName: "",
    jerseyColor: "",
    players: Array.from({ length: 11 }, (_, index) => buildEmptyPlayer(index)),
    prefix,
  };
}

function initialAdvancedDelivery() {
  return {
    runs: 0,
    extraType: "",
    extraRuns: 0,
    wicketType: "",
    dismissedPlayerId: "",
    fielderId: "",
    nextBatterId: "",
    bowlerId: "",
    nextBowlerId: "",
  };
}

export default function ScorerPanel() {
  const [phone, setPhone] = useState(SCORER_PHONE);
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [tournaments, setTournaments] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [selectedFixtureId, setSelectedFixtureId] = useState("");
  const [selectedMatch, setSelectedMatch] = useState(null);

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
    powerplayOvers: 0,
    freeHit: true,
    wideValue: 1,
    noBallValue: 1,
  });

  const [fixtureForm, setFixtureForm] = useState({
    tournamentId: "",
    matchDate: "",
    ground: "",
    team1: buildEmptyTeam("A"),
    team2: buildEmptyTeam("B"),
  });

  const [startForm, setStartForm] = useState({
    inningsNumber: 1,
    battingTeamId: "",
    bowlingTeamId: "",
    tossWinnerTeamId: "",
    tossDecision: "bat",
    strikerId: "",
    nonStrikerId: "",
    bowlerId: "",
  });

  const [advancedDelivery, setAdvancedDelivery] = useState(initialAdvancedDelivery());
  const [showSetup, setShowSetup] = useState(false);
  const [showRunOutModal, setShowRunOutModal] = useState(false);
  const [showCaughtModal, setShowCaughtModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [runOutForm, setRunOutForm] = useState({ dismissedPlayerId: "", runs: 0, nextBatterId: "" });
  const [caughtForm, setCaughtForm] = useState({ dismissedPlayerId: "", fielderId: "", runs: 0, nextBatterId: "" });
  const [pendingBowlerId, setPendingBowlerId] = useState("");
  const [pendingBatterId, setPendingBatterId] = useState("");

  useEffect(() => {
    const savedToken = window.localStorage.getItem("scorer-token");
    const savedUser = window.localStorage.getItem("scorer-user");
    if (savedToken) {
      setToken(savedToken);
    }
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadScorerWorkspace();
  }, [token]);

  useEffect(() => {
    if (!selectedFixtureId) {
      setSelectedMatch(null);
      return;
    }

    if (!token) return;

    let active = true;
    fetchApi(`/matches/${selectedFixtureId}`)
      .then((result) => {
        if (!active) return;
        setSelectedMatch(result.data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load match.");
      });

    return () => {
      active = false;
    };
  }, [selectedFixtureId, token]);

  useEffect(() => {
    if (!selectedFixtureId || !token) return undefined;

    const socket = io(socketUrl, {
      path: socketPath,
      transports: ["websocket", "polling"],
    });

    const handleScoreUpdate = (data) => {
      if (data && typeof data === "object") {
        setSelectedMatch(data);
      }
    };

    socket.on("connect", () => {
      socket.emit("join_match", Number(selectedFixtureId));
    });
    socket.on("score_update", handleScoreUpdate);

    return () => {
      socket.off("score_update", handleScoreUpdate);
      socket.disconnect();
    };
  }, [selectedFixtureId, token]);

  useEffect(() => {
    if (tournaments.length && !selectedTournamentId) {
      const firstId = tournaments[0].id.toString();
      setSelectedTournamentId(firstId);
      setFixtureForm((current) => ({ ...current, tournamentId: firstId }));
    }
  }, [tournaments, selectedTournamentId]);

  useEffect(() => {
    if (!selectedMatch?.liveData?.lineups) return;

    const team1Id = selectedMatch.liveData.lineups.team1?.teamId?.toString() || "";
    const team2Id = selectedMatch.liveData.lineups.team2?.teamId?.toString() || "";
    const defaultBattingTeamId = startForm.battingTeamId || team1Id;
    const defaultBowlingTeamId = defaultBattingTeamId === team1Id ? team2Id : team1Id;
    const battingLineup = lineupForTeam(selectedMatch, defaultBattingTeamId);
    const bowlingLineup = lineupForTeam(selectedMatch, defaultBowlingTeamId);

    setStartForm((current) => ({
      ...current,
      battingTeamId: current.battingTeamId || defaultBattingTeamId,
      bowlingTeamId: current.bowlingTeamId || defaultBowlingTeamId,
      tossWinnerTeamId: current.tossWinnerTeamId || defaultBattingTeamId,
      strikerId: current.strikerId || battingLineup?.playingXI?.[0]?.toString() || "",
      nonStrikerId: current.nonStrikerId || battingLineup?.playingXI?.[1]?.toString() || "",
      bowlerId: current.bowlerId || bowlingLineup?.playingXI?.[0]?.toString() || "",
    }));

    setAdvancedDelivery((current) => ({
      ...current,
      dismissedPlayerId: current.dismissedPlayerId || selectedMatch.strikerCard?.playerId?.toString() || "",
      nextBatterId: current.nextBatterId || selectedMatch.availableNextBatters?.[0]?.playerId?.toString() || "",
      bowlerId: current.bowlerId || selectedMatch.bowlerCard?.playerId?.toString() || bowlingLineup?.playingXI?.[0]?.toString() || "",
      nextBowlerId: current.nextBowlerId || bowlingLineup?.playingXI?.[0]?.toString() || "",
    }));
  }, [selectedMatch]);

  const currentBattingLineup = useMemo(
    () => lineupForTeam(selectedMatch, startForm.battingTeamId),
    [selectedMatch, startForm.battingTeamId],
  );

  const currentBowlingLineup = useMemo(
    () => lineupForTeam(selectedMatch, startForm.bowlingTeamId),
    [selectedMatch, startForm.bowlingTeamId],
  );

  const matchPhase = selectedMatch?.liveData?.current?.phase;
  const pendingInningsTransition = selectedMatch?.liveData?.current?.pendingInningsTransition;
  const needsInningsSetup = Boolean(
    selectedMatch && (matchPhase === "scheduled" || matchPhase === "innings_break" || pendingInningsTransition === "second_innings"),
  );
  const isLiveScoring = matchPhase === "live" && !pendingInningsTransition;
  const legalBalls = selectedMatch?.currentInningsState?.legalBalls ?? 0;
  const requiresNewBowler = Boolean(
    selectedMatch?.requiresNewBowler ?? selectedMatch?.liveData?.current?.requiresNewBowler,
  );
  const requiresNewBatter = Boolean(
    selectedMatch?.requiresNewBatter ?? selectedMatch?.liveData?.current?.requiresNewBatter,
  );
  const pendingSecondInnings = pendingInningsTransition === "second_innings";
  const pendingMatchEnd = pendingInningsTransition === "match_complete";
  const needsOverProceed = requiresNewBowler;
  const scoringLocked = needsOverProceed || requiresNewBatter || pendingSecondInnings || pendingMatchEnd;
  const fieldingPlayers = useMemo(() => {
    const bowlingTeamId = selectedMatch?.liveData?.current?.bowlingTeamId;
    const lineup = lineupForTeam(selectedMatch, bowlingTeamId?.toString());
    return lineup?.players || [];
  }, [selectedMatch]);

  useEffect(() => {
    if (!selectedMatch) return;
    if (needsOverProceed) {
      const defaultBowler = selectedMatch.availableBowlers?.find(
        (player) => player.playerId?.toString() !== selectedMatch.liveData?.current?.bowlerId?.toString(),
      );
      setPendingBowlerId(
        defaultBowler?.playerId?.toString() || selectedMatch.availableBowlers?.[0]?.playerId?.toString() || "",
      );
    }
    if (requiresNewBatter) {
      setPendingBatterId(selectedMatch.availableNextBatters?.[0]?.playerId?.toString() || "");
    }
  }, [needsOverProceed, requiresNewBatter, selectedMatch?.fixture_id]);

  async function loadScorerWorkspace() {
    try {
      setLoading(true);
      setError("");
      const tournamentResult = await fetchApi("/tournaments");
      const tournamentList = tournamentResult.data || [];
      setTournaments(tournamentList);

      const fixtureResults = await Promise.all(
        tournamentList.map((tournament) => fetchApi(`/tournaments/${tournament.id}/fixtures`)),
      );

      const allFixtures = fixtureResults.flatMap((result) => result.data || []);
      setFixtures(allFixtures);
      setShowSetup(allFixtures.length === 0);

      if (!selectedFixtureId && allFixtures.length) {
        setSelectedFixtureId(allFixtures[0].id.toString());
      }
    } catch (err) {
      setError(err.message || "Failed to load scorer workspace.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOtp() {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      await fetchApi("/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      setMessage("OTP requested successfully. Use the scorer OTP configured for this account.");
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
      setMessage("");
      const result = await fetchApi("/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });

      window.localStorage.setItem("scorer-token", result.token);
      window.localStorage.setItem("scorer-user", JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);
      setMessage("Scorer login successful.");
    } catch (err) {
      setError(err.message || "Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    window.localStorage.removeItem("scorer-token");
    window.localStorage.removeItem("scorer-user");
    setToken("");
    setUser(null);
    setMessage("");
    setError("");
  }

  async function handleCreateTournament(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      await fetchAuthorizedApi("/tournaments", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tournamentForm),
      });

      setMessage("Tournament created successfully.");
      setTournamentForm({
        name: "",
        type: "leather_ball",
        prizeMoney: "",
        startDate: "",
        endDate: "",
        groundName: "",
        address: "",
        overs: 20,
        playersPerTeam: 11,
        powerplayOvers: 0,
        freeHit: true,
        wideValue: 1,
        noBallValue: 1,
      });
      await loadScorerWorkspace();
    } catch (err) {
      setError(err.message || "Failed to create tournament.");
    } finally {
      setLoading(false);
    }
  }

  async function handleScheduleFixture(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const result = await fetchAuthorizedApi(`/tournaments/${fixtureForm.tournamentId}/fixtures`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchDate: fixtureForm.matchDate,
          ground: fixtureForm.ground,
          team1: serializeTeamForApi(fixtureForm.team1),
          team2: serializeTeamForApi(fixtureForm.team2),
        }),
      });

      setMessage("Fixture scheduled successfully.");
      setShowSetup(false);
      setFixtureForm((current) => ({
        ...current,
        matchDate: "",
        ground: "",
        team1: buildEmptyTeam("A"),
        team2: buildEmptyTeam("B"),
      }));
      await loadScorerWorkspace();
      if (result.data?.fixture?.id) {
        setSelectedFixtureId(result.data.fixture.id.toString());
      }
    } catch (err) {
      setError(err.message || "Failed to schedule fixture.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartMatch(event) {
    event.preventDefault();
    if (!selectedFixtureId) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const result = await fetchAuthorizedApi(`/matches/${selectedFixtureId}/start`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inningsNumber: Number(startForm.inningsNumber),
          battingTeamId: Number(startForm.battingTeamId),
          bowlingTeamId: Number(startForm.bowlingTeamId),
          tossWinnerTeamId: Number(startForm.tossWinnerTeamId),
          tossDecision: startForm.tossDecision,
          strikerId: Number(startForm.strikerId),
          nonStrikerId: Number(startForm.nonStrikerId),
          bowlerId: Number(startForm.bowlerId),
        }),
      });

      setMessage("Innings started successfully.");
      setSelectedMatch(result.data);
      await loadScorerWorkspace();
    } catch (err) {
      setError(err.message || "Failed to start innings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmBowler() {
    if (!selectedFixtureId || !pendingBowlerId) return;

    try {
      setLoading(true);
      setError("");
      const result = await fetchAuthorizedApi(`/matches/${selectedFixtureId}/select-bowler`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextBowlerId: Number(pendingBowlerId) }),
      });
      setSelectedMatch(result.matchState);
      setMessage("Next bowler confirmed. Over started.");
      setPendingBowlerId("");
      setShowBowlerModal(false);
    } catch (err) {
      setError(err.message || "Failed to confirm bowler.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledgeNextInnings() {
    if (!selectedFixtureId) return;

    try {
      setLoading(true);
      setError("");
      const result = await fetchAuthorizedApi(`/matches/${selectedFixtureId}/acknowledge-next-innings`, token, {
        method: "POST",
      });
      setSelectedMatch(result.matchState);
      setMessage("Proceed to match setup and start the 2nd innings.");
      setShowSetup(false);
      setStartForm((current) => ({ ...current, inningsNumber: 2 }));
    } catch (err) {
      setError(err.message || "Failed to proceed to next innings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEndMatch() {
    if (!selectedFixtureId) return;

    try {
      setLoading(true);
      setError("");
      const result = await fetchAuthorizedApi(`/matches/${selectedFixtureId}/end-match`, token, {
        method: "POST",
      });
      setSelectedMatch(result.matchState);
      setMessage(result.matchState?.result?.summary || "Match ended successfully.");
    } catch (err) {
      setError(err.message || "Failed to end match.");
    } finally {
      setLoading(false);
    }
  }

  function openNextOverModal() {
    if (!selectedMatch) return;
    const defaultBowler = selectedMatch.availableBowlers?.find(
      (player) => player.playerId?.toString() !== selectedMatch.liveData?.current?.bowlerId?.toString(),
    );
    setPendingBowlerId(
      defaultBowler?.playerId?.toString() || selectedMatch.availableBowlers?.[0]?.playerId?.toString() || "",
    );
    setShowBowlerModal(true);
  }

  async function handleConfirmBatter() {
    if (!selectedFixtureId || !pendingBatterId) return;

    try {
      setLoading(true);
      setError("");
      const result = await fetchAuthorizedApi(`/matches/${selectedFixtureId}/select-batter`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextBatterId: Number(pendingBatterId) }),
      });
      setSelectedMatch(result.matchState);
      setMessage("Next batter confirmed.");
      setPendingBatterId("");
    } catch (err) {
      setError(err.message || "Failed to confirm batter.");
    } finally {
      setLoading(false);
    }
  }

  function openCaughtModal() {
    if (!selectedMatch) return;
    setCaughtForm({
      dismissedPlayerId: selectedMatch.strikerCard?.playerId?.toString() || "",
      fielderId: fieldingPlayers[0]?.id?.toString() || "",
      runs: 0,
      nextBatterId: selectedMatch.availableNextBatters?.[0]?.playerId?.toString() || "",
    });
    setShowCaughtModal(true);
  }

  async function submitCaught(event) {
    event.preventDefault();
    if (!selectedFixtureId || !caughtForm.fielderId || !caughtForm.dismissedPlayerId) return;

    try {
      setLoading(true);
      setError("");
      const result = await fetchAuthorizedApi(`/matches/${selectedFixtureId}/score`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runs: Number(caughtForm.runs || 0),
          wicketType: "caught",
          dismissedPlayerId: Number(caughtForm.dismissedPlayerId),
          fielderId: Number(caughtForm.fielderId),
          nextBatterId: caughtForm.nextBatterId ? Number(caughtForm.nextBatterId) : null,
          bowlerId: selectedMatch.liveData?.current?.bowlerId || null,
        }),
      });

      setSelectedMatch(result.matchState);
      setShowCaughtModal(false);
      setMessage("Caught out recorded.");
    } catch (err) {
      setError(err.message || "Failed to record catch.");
    } finally {
      setLoading(false);
    }
  }

  function openRunOutModal() {
    if (!selectedMatch) return;
    setRunOutForm({
      dismissedPlayerId: selectedMatch.strikerCard?.playerId?.toString() || "",
      runs: 0,
      nextBatterId: selectedMatch.availableNextBatters?.[0]?.playerId?.toString() || "",
    });
    setShowRunOutModal(true);
  }

  async function submitRunOut(event) {
    event.preventDefault();
    if (!selectedFixtureId || !runOutForm.dismissedPlayerId) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const result = await fetchAuthorizedApi(`/matches/${selectedFixtureId}/score`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runs: Number(runOutForm.runs || 0),
          wicketType: "runout",
          dismissedPlayerId: Number(runOutForm.dismissedPlayerId),
          nextBatterId: runOutForm.nextBatterId ? Number(runOutForm.nextBatterId) : null,
          bowlerId: selectedMatch.liveData?.current?.bowlerId || null,
        }),
      });

      setSelectedMatch(result.matchState);
      setShowRunOutModal(false);
      setMessage("Run out recorded.");
    } catch (err) {
      setError(err.message || "Failed to record run out.");
    } finally {
      setLoading(false);
    }
  }

  async function submitQuickBall(runs, extraType = null, wicketType = null) {
    if (!selectedFixtureId || !selectedMatch) return;
    if (scoringLocked) {
      setError(
        needsOverProceed
          ? "Proceed to the next over before scoring."
          : "Complete the required match action before scoring.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const body = {
        runs,
        extraType,
        extraRuns: extraType ? 1 : 0,
        wicketType,
        dismissedPlayerId: wicketType ? Number(advancedDelivery.dismissedPlayerId || selectedMatch.strikerCard?.playerId) : null,
        nextBatterId: advancedDelivery.nextBatterId ? Number(advancedDelivery.nextBatterId) : null,
        bowlerId: advancedDelivery.bowlerId ? Number(advancedDelivery.bowlerId) : null,
        nextBowlerId: advancedDelivery.nextBowlerId ? Number(advancedDelivery.nextBowlerId) : null,
      };

      const result = await fetchAuthorizedApi(`/matches/${selectedFixtureId}/score`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setSelectedMatch(result.matchState);
    } catch (err) {
      setError(err.message || "Failed to score delivery.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAdvancedDelivery(event) {
    event.preventDefault();
    if (!selectedFixtureId) return;
    if (scoringLocked) {
      setError(
        needsOverProceed
          ? "Proceed to the next over before scoring."
          : "Complete the required match action before scoring.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const payload = {
        runs: Number(advancedDelivery.runs || 0),
        extraType: advancedDelivery.extraType || null,
        extraRuns: advancedDelivery.extraType ? Number(advancedDelivery.extraRuns || 0) : 0,
        wicketType: advancedDelivery.wicketType || null,
        dismissedPlayerId: advancedDelivery.dismissedPlayerId ? Number(advancedDelivery.dismissedPlayerId) : null,
        fielderId: advancedDelivery.wicketType === "caught" && advancedDelivery.fielderId
          ? Number(advancedDelivery.fielderId)
          : null,
        nextBatterId: advancedDelivery.nextBatterId ? Number(advancedDelivery.nextBatterId) : null,
        bowlerId: advancedDelivery.bowlerId ? Number(advancedDelivery.bowlerId) : null,
        nextBowlerId: advancedDelivery.nextBowlerId ? Number(advancedDelivery.nextBowlerId) : null,
      };

      const result = await fetchAuthorizedApi(`/matches/${selectedFixtureId}/score`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setSelectedMatch(result.matchState);
      setAdvancedDelivery(initialAdvancedDelivery());
    } catch (err) {
      setError(err.message || "Failed to submit advanced delivery.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUndo() {
    if (!selectedFixtureId) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const result = await fetchAuthorizedApi(`/matches/${selectedFixtureId}/undo`, token, {
        method: "POST",
      });

      setSelectedMatch(result.matchState);
      await loadScorerWorkspace();
    } catch (err) {
      setError(err.message || "Failed to undo last ball.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {!token ? (
        <section className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-2xl mx-auto">
          <div>
            <div className="flex items-center gap-2 text-accent font-extrabold text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              Scorer Access
            </div>
            <h1 className="text-3xl font-extrabold font-display tracking-tight mt-2">Scorer Login</h1>
            <p className="text-sm text-subtext mt-2">Sign in with the official scorer mobile number and OTP.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Mobile Number" value={phone} onChange={setPhone} />
            <Field label="OTP" value={otp} onChange={setOtp} placeholder="1978" />
            <div className="flex gap-2 items-end">
              <button onClick={handleRequestOtp} disabled={loading} className="flex-1 bg-background border border-border text-text font-bold px-4 py-3 rounded-lg disabled:opacity-50">
                Request OTP
              </button>
              <button onClick={handleVerifyOtp} disabled={loading} className="flex-1 bg-accent text-black font-black px-4 py-3 rounded-lg disabled:opacity-50">
                Verify
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3 text-xs">
            <ShieldCheck className="w-4 h-4 text-accent mt-0.5" />
            <div className="space-y-1">
              <p className="text-text font-semibold">Scorer credentials</p>
              <p className="text-subtext">Mobile: 6360200382 · OTP: 1978</p>
            </div>
          </div>

          {message && (
            <div className="bg-[#1C3A27] border border-[#276F43] rounded-xl p-4 text-sm text-accent flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5" />
              <span>{message}</span>
            </div>
          )}
          {error && <div className="text-sm text-red-400">{error}</div>}
        </section>
      ) : (
        <>
          <section className="bg-card border border-border rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-accent font-extrabold text-xs uppercase tracking-widest">
                  <Sparkles className="w-4 h-4" />
                  Scorer Console
                </div>
                <h1 className="text-2xl font-extrabold font-display tracking-tight mt-1">
                  {user?.name || "Official Scorer"}
                </h1>
                <p className="text-xs text-subtext mt-1">{user?.phone || phone}</p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[220px] flex-1">
                  <label className="text-[10px] text-subtext uppercase font-bold block mb-1">Active Fixture</label>
                  <select
                    value={selectedFixtureId}
                    onChange={(event) => setSelectedFixtureId(event.target.value)}
                    className="w-full bg-background border border-border px-3 py-2.5 rounded-lg text-sm text-text"
                  >
                    {fixtures.map((fixture) => (
                      <option key={fixture.id} value={fixture.id.toString()}>
                        {fixture.team1_name || "Team A"} vs {fixture.team2_name || "Team B"} ({fixture.status})
                      </option>
                    ))}
                  </select>
                </div>
                <button onClick={logout} className="bg-background border border-border px-4 py-2.5 rounded-lg text-xs font-bold text-text flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>

            {message && (
              <div className="mt-4 bg-[#1C3A27] border border-[#276F43] rounded-xl p-3 text-sm text-accent flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{message}</span>
              </div>
            )}
            {error && <div className="mt-4 text-sm text-red-400">{error}</div>}
          </section>

          {(fixtures.length === 0 || showSetup) && (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 text-accent font-extrabold text-xs uppercase tracking-widest">
                <Trophy className="w-4 h-4" />
                Create Tournament
              </div>
              <form onSubmit={handleCreateTournament} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Tournament Name" value={tournamentForm.name} onChange={(value) => setTournamentForm((current) => ({ ...current, name: value }))} />
                  <SelectField
                    label="Format"
                    value={tournamentForm.type}
                    onChange={(value) => setTournamentForm((current) => ({ ...current, type: value }))}
                    options={[
                      { value: "leather_ball", label: "Leather Ball" },
                      { value: "box_cricket", label: "Box Cricket" },
                      { value: "turf_cricket", label: "Turf Cricket" },
                      { value: "indoor_cricket", label: "Indoor Cricket" },
                    ]}
                  />
                  <Field label="Prize Money" value={tournamentForm.prizeMoney} onChange={(value) => setTournamentForm((current) => ({ ...current, prizeMoney: value }))} />
                  <Field label="Ground Name" value={tournamentForm.groundName} onChange={(value) => setTournamentForm((current) => ({ ...current, groundName: value }))} />
                  <Field label="Address" value={tournamentForm.address} onChange={(value) => setTournamentForm((current) => ({ ...current, address: value }))} />
                  <Field label="Start Date" type="date" value={tournamentForm.startDate} onChange={(value) => setTournamentForm((current) => ({ ...current, startDate: value }))} />
                  <Field label="End Date" type="date" value={tournamentForm.endDate} onChange={(value) => setTournamentForm((current) => ({ ...current, endDate: value }))} />
                  <Field label="Overs Per Innings" type="number" value={String(tournamentForm.overs)} onChange={(value) => setTournamentForm((current) => ({ ...current, overs: Number(value || 0) }))} />
                  <Field label="Players Per Team" type="number" value={String(tournamentForm.playersPerTeam)} onChange={(value) => setTournamentForm((current) => ({ ...current, playersPerTeam: Number(value || 0) }))} />
                  <Field label="Powerplay Overs" type="number" value={String(tournamentForm.powerplayOvers)} onChange={(value) => setTournamentForm((current) => ({ ...current, powerplayOvers: Number(value || 0) }))} />
                  <Field label="Wide Value" type="number" value={String(tournamentForm.wideValue)} onChange={(value) => setTournamentForm((current) => ({ ...current, wideValue: Number(value || 0) }))} />
                  <Field label="No Ball Value" type="number" value={String(tournamentForm.noBallValue)} onChange={(value) => setTournamentForm((current) => ({ ...current, noBallValue: Number(value || 0) }))} />
                  <SelectField
                    label="Free Hit"
                    value={String(tournamentForm.freeHit)}
                    onChange={(value) => setTournamentForm((current) => ({ ...current, freeHit: value === "true" }))}
                    options={[
                      { value: "true", label: "Enabled" },
                      { value: "false", label: "Disabled" },
                    ]}
                  />
                </div>
                <button type="submit" disabled={loading} className="bg-accent text-black font-black px-5 py-3 rounded-lg disabled:opacity-50">
                  Create Tournament
                </button>
              </form>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-2 text-accent font-extrabold text-xs uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                Schedule Fixture
              </div>

              <form onSubmit={handleScheduleFixture} className="space-y-4">
                <SelectField
                  label="Tournament"
                  value={fixtureForm.tournamentId}
                  onChange={(value) => setFixtureForm((current) => ({ ...current, tournamentId: value }))}
                  options={tournaments.map((tournament) => ({ value: tournament.id.toString(), label: tournament.name }))}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Match Date & Time" type="datetime-local" value={fixtureForm.matchDate} onChange={(value) => setFixtureForm((current) => ({ ...current, matchDate: value }))} />
                  <Field label="Venue" value={fixtureForm.ground} onChange={(value) => setFixtureForm((current) => ({ ...current, ground: value }))} />
                </div>

                <TeamRosterEditor
                  title="Team A"
                  team={fixtureForm.team1}
                  onChange={(team) => setFixtureForm((current) => ({ ...current, team1: team }))}
                />
                <TeamRosterEditor
                  title="Team B"
                  team={fixtureForm.team2}
                  onChange={(team) => setFixtureForm((current) => ({ ...current, team2: team }))}
                />

                <button type="submit" disabled={loading || !fixtureForm.tournamentId} className="bg-accent text-black font-black px-5 py-3 rounded-lg disabled:opacity-50">
                  Schedule Match
                </button>
              </form>
            </div>
          </section>
          )}

          {fixtures.length > 0 && !showSetup && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowSetup(true)}
                className="text-xs font-bold text-accent flex items-center gap-1"
              >
                <ChevronDown className="w-4 h-4" />
                Show tournament & fixture setup
              </button>
            </div>
          )}

          {fixtures.length > 0 && showSetup && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowSetup(false)}
                className="text-xs font-bold text-subtext flex items-center gap-1"
              >
                <ChevronUp className="w-4 h-4" />
                Hide setup panels
              </button>
            </div>
          )}

          {needsInningsSetup && (
          <section className="bg-card border border-border rounded-2xl p-6 space-y-5 max-w-3xl">
              <div className="flex items-center gap-2 text-accent font-extrabold text-xs uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4" />
                {matchPhase === "innings_break" ? "Start 2nd Innings" : "Match Setup"}
              </div>

              {selectedMatch?.liveData?.lineups && (
                <form onSubmit={handleStartMatch} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                      label="Batting Team"
                      value={startForm.battingTeamId}
                      onChange={(value) => {
                        const team1Id = selectedMatch.liveData.lineups.team1.teamId.toString();
                        const team2Id = selectedMatch.liveData.lineups.team2.teamId.toString();
                        const bowlingTeamId = value === team1Id ? team2Id : team1Id;
                        const battingLineup = lineupForTeam(selectedMatch, value);
                        const bowlingLineup = lineupForTeam(selectedMatch, bowlingTeamId);

                        setStartForm((current) => ({
                          ...current,
                          battingTeamId: value,
                          bowlingTeamId,
                          tossWinnerTeamId: current.tossWinnerTeamId || value,
                          strikerId: battingLineup?.playingXI?.[0]?.toString() || "",
                          nonStrikerId: battingLineup?.playingXI?.[1]?.toString() || "",
                          bowlerId: bowlingLineup?.playingXI?.[0]?.toString() || "",
                        }));
                      }}
                      options={[
                        { value: selectedMatch.liveData.lineups.team1.teamId.toString(), label: selectedMatch.team1Name },
                        { value: selectedMatch.liveData.lineups.team2.teamId.toString(), label: selectedMatch.team2Name },
                      ]}
                    />
                    <SelectField
                      label="Bowling Team"
                      value={startForm.bowlingTeamId}
                      onChange={() => {}}
                      disabled
                      options={[
                        { value: startForm.bowlingTeamId, label: teamNameForId(selectedMatch, startForm.bowlingTeamId) || "Auto" },
                      ]}
                    />
                    <SelectField
                      label="Toss Winner"
                      value={startForm.tossWinnerTeamId}
                      onChange={(value) => setStartForm((current) => ({ ...current, tossWinnerTeamId: value }))}
                      options={[
                        { value: selectedMatch.liveData.lineups.team1.teamId.toString(), label: selectedMatch.team1Name },
                        { value: selectedMatch.liveData.lineups.team2.teamId.toString(), label: selectedMatch.team2Name },
                      ]}
                    />
                    <SelectField
                      label="Toss Decision"
                      value={startForm.tossDecision}
                      onChange={(value) => setStartForm((current) => ({ ...current, tossDecision: value }))}
                      options={[
                        { value: "bat", label: "Bat" },
                        { value: "bowl", label: "Bowl" },
                      ]}
                    />
                    <SelectField
                      label="Striker"
                      value={startForm.strikerId}
                      onChange={(value) => setStartForm((current) => ({ ...current, strikerId: value }))}
                      options={(currentBattingLineup?.players || []).map((player) => ({ value: player.id.toString(), label: player.name }))}
                    />
                    <SelectField
                      label="Non-Striker"
                      value={startForm.nonStrikerId}
                      onChange={(value) => setStartForm((current) => ({ ...current, nonStrikerId: value }))}
                      options={(currentBattingLineup?.players || []).map((player) => ({ value: player.id.toString(), label: player.name }))}
                    />
                    <SelectField
                      label="Opening Bowler"
                      value={startForm.bowlerId}
                      onChange={(value) => setStartForm((current) => ({ ...current, bowlerId: value }))}
                      options={(currentBowlingLineup?.players || []).map((player) => ({ value: player.id.toString(), label: player.name }))}
                    />
                    <SelectField
                      label="Innings"
                      value={String(startForm.inningsNumber)}
                      onChange={(value) => setStartForm((current) => ({ ...current, inningsNumber: Number(value) }))}
                      options={[
                        { value: "1", label: "1st Innings" },
                        { value: "2", label: "2nd Innings" },
                      ]}
                    />
                  </div>

                  <button type="submit" disabled={loading || !selectedFixtureId} className="bg-accent text-black font-black px-5 py-3 rounded-lg disabled:opacity-50">
                    {matchPhase === "innings_break" ? "Start 2nd Innings" : "Start Innings"}
                  </button>
                </form>
              )}
          </section>
          )}

          <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-accent font-extrabold text-xs uppercase tracking-widest">
                  <Sparkles className="w-4 h-4" />
                  Live Scoring
                </div>
                <button onClick={handleUndo} disabled={loading || !selectedFixtureId} className="bg-background border border-border px-4 py-2 rounded-lg text-xs font-bold text-text disabled:opacity-50 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Undo
                </button>
              </div>

              {selectedMatch ? (
                <div className="space-y-5">
                  {showBowlerModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
                      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
                        <h3 className="font-extrabold text-lg">Select next bowler</h3>
                        <p className="text-xs text-subtext">A new over is about to begin. Choose the bowler to continue.</p>
                        <SelectField
                          label="Bowler for next over"
                          value={pendingBowlerId}
                          onChange={setPendingBowlerId}
                          options={(selectedMatch.availableBowlers || []).map((player) => ({
                            value: player.playerId.toString(),
                            label: `${player.name} — ${player.overs} ov, ${player.wickets} wkts`,
                          }))}
                        />
                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowBowlerModal(false)}
                            className="flex-1 border border-border py-3 rounded-lg font-bold text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmBowler}
                            disabled={loading || !pendingBowlerId}
                            className="flex-1 bg-accent text-black font-black py-3 rounded-lg disabled:opacity-50"
                          >
                            Start Over
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {showRunOutModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                      <form onSubmit={submitRunOut} className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
                        <h3 className="font-extrabold text-lg">Record Run Out</h3>
                        <p className="text-xs text-subtext">Select which batter was run out and who comes in next.</p>
                        <SelectField
                          label="Batter Out"
                          value={runOutForm.dismissedPlayerId}
                          onChange={(value) => setRunOutForm((c) => ({ ...c, dismissedPlayerId: value }))}
                          options={selectedMatch.currentInningsState?.batsmen
                            ?.filter((p) => p.status === "batting")
                            .map((p) => ({ value: p.playerId.toString(), label: p.name })) || []}
                        />
                        <Field
                          label="Runs on delivery (if any)"
                          type="number"
                          value={String(runOutForm.runs)}
                          onChange={(value) => setRunOutForm((c) => ({ ...c, runs: value }))}
                        />
                        <SelectField
                          label="Next Batter"
                          value={runOutForm.nextBatterId}
                          onChange={(value) => setRunOutForm((c) => ({ ...c, nextBatterId: value }))}
                          options={[
                            { value: "", label: "Prompt after wicket" },
                            ...((selectedMatch.availableNextBatters || []).map((p) => ({
                              value: p.playerId.toString(),
                              label: p.name,
                            }))),
                          ]}
                        />
                        <div className="flex gap-3">
                          <button type="button" onClick={() => setShowRunOutModal(false)} className="flex-1 border border-border py-3 rounded-lg font-bold text-sm">
                            Cancel
                          </button>
                          <button type="submit" disabled={loading} className="flex-1 bg-accent text-black font-black py-3 rounded-lg disabled:opacity-50">
                            Confirm Run Out
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="glass-panel border border-border p-5 rounded-2xl space-y-4">
                    <div>
                      <div className="text-xs text-subtext uppercase font-bold tracking-wider">
                        {selectedMatch.team1Name} vs {selectedMatch.team2Name}
                      </div>
                      <h2 className="text-4xl font-black font-display text-accent mt-2">
                        {selectedMatch.currentInningsState?.runs ?? 0}-{selectedMatch.currentInningsState?.wickets ?? 0}
                      </h2>
                      <p className="text-sm text-subtext mt-1">
                        Over: <span className="font-bold text-text">{selectedMatch.currentInningsState?.overs ?? 0}</span>
                        {selectedMatch.targetRuns ? ` • Target ${selectedMatch.targetRuns}` : ""}
                      </p>
                      <p className="text-xs text-subtext mt-2">
                        Phase: {selectedMatch.liveData.current.phase}
                        {needsOverProceed ? " • Over ended — proceed to next over" : ""}
                        {requiresNewBatter ? " • Select next batter" : ""}
                        {pendingSecondInnings ? " • Ready for 2nd innings" : ""}
                        {pendingMatchEnd ? " • Ready to end match" : ""}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <ScorecardCard title="Striker" player={selectedMatch.strikerCard} />
                      <ScorecardCard title="Non-Striker" player={selectedMatch.nonStrikerCard} />
                      <BowlerCard title="Bowler" player={selectedMatch.bowlerCard} />
                    </div>
                  </div>

                  {showCaughtModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
                      <form onSubmit={submitCaught} className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
                        <h3 className="font-extrabold text-lg">Record Caught Out</h3>
                        <SelectField
                          label="Batter Out"
                          value={caughtForm.dismissedPlayerId}
                          onChange={(value) => setCaughtForm((c) => ({ ...c, dismissedPlayerId: value }))}
                          options={selectedMatch.currentInningsState?.batsmen
                            ?.filter((p) => p.status === "batting")
                            .map((p) => ({ value: p.playerId.toString(), label: p.name })) || []}
                        />
                        <SelectField
                          label="Fielder (Caught By)"
                          value={caughtForm.fielderId}
                          onChange={(value) => setCaughtForm((c) => ({ ...c, fielderId: value }))}
                          options={fieldingPlayers.map((p) => ({
                            value: p.id.toString(),
                            label: p.name,
                          }))}
                        />
                        <Field
                          label="Runs on delivery (if any)"
                          type="number"
                          value={String(caughtForm.runs)}
                          onChange={(value) => setCaughtForm((c) => ({ ...c, runs: value }))}
                        />
                        <SelectField
                          label="Next Batter"
                          value={caughtForm.nextBatterId}
                          onChange={(value) => setCaughtForm((c) => ({ ...c, nextBatterId: value }))}
                          options={[
                            { value: "", label: "Prompt after wicket" },
                            ...((selectedMatch.availableNextBatters || []).map((p) => ({
                              value: p.playerId.toString(),
                              label: p.name,
                            }))),
                          ]}
                        />
                        <div className="flex gap-3">
                          <button type="button" onClick={() => setShowCaughtModal(false)} className="flex-1 border border-border py-3 rounded-lg font-bold text-sm">
                            Cancel
                          </button>
                          <button type="submit" disabled={loading || !caughtForm.fielderId} className="flex-1 bg-accent text-black font-black py-3 rounded-lg disabled:opacity-50">
                            Confirm Catch
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {needsOverProceed ? (
                    <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 p-8 md:p-10 text-center space-y-5">
                      <div>
                        <h3 className="font-extrabold text-lg text-amber-400 uppercase tracking-wider">
                          Over complete
                        </h3>
                        <p className="text-sm text-subtext mt-2 max-w-md mx-auto">
                          Run entry is locked until you select the bowler for the next over.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openNextOverModal}
                        className="w-full max-w-md mx-auto bg-accent hover:bg-accent-hover text-black font-black text-base px-8 py-4 rounded-xl shadow-lg transition-all"
                      >
                        Proceed to Next Over
                      </button>
                    </div>
                  ) : requiresNewBatter ? (
                    <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 p-6 space-y-4">
                      <h3 className="font-extrabold text-sm text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <UserPlus className="w-4 h-4" />
                        Wicket — select next batter
                      </h3>
                      <p className="text-xs text-subtext">
                        Run entry is locked until the new batter is confirmed.
                      </p>
                      <SelectField
                        label="Next Batter"
                        value={pendingBatterId}
                        onChange={setPendingBatterId}
                        options={(selectedMatch.availableNextBatters || []).map((player) => ({
                          value: player.playerId.toString(),
                          label: player.name,
                        }))}
                      />
                      <button
                        type="button"
                        onClick={handleConfirmBatter}
                        disabled={loading || !pendingBatterId}
                        className="w-full bg-accent text-black font-black px-5 py-3 rounded-lg disabled:opacity-50"
                      >
                        Confirm Batter &amp; Resume Scoring
                      </button>
                    </div>
                  ) : pendingSecondInnings ? (
                    <div className="rounded-2xl border-2 border-blue-500/40 bg-blue-500/10 p-8 text-center space-y-4">
                      <h3 className="font-extrabold text-lg text-blue-300 uppercase tracking-wider">
                        1st innings complete
                      </h3>
                      <p className="text-sm text-subtext">
                        1st innings: {selectedMatch.innings1?.runs ?? 0}/{selectedMatch.innings1?.wickets ?? 0} (
                        {selectedMatch.innings1?.overs ?? 0} ov). Target: {selectedMatch.liveData?.current?.targetRuns}.
                      </p>
                      <button
                        type="button"
                        onClick={handleAcknowledgeNextInnings}
                        disabled={loading}
                        className="w-full max-w-md mx-auto bg-accent text-black font-black px-8 py-4 rounded-xl disabled:opacity-50"
                      >
                        Next Innings
                      </button>
                    </div>
                  ) : pendingMatchEnd ? (
                    <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 p-8 text-center space-y-4">
                      <h3 className="font-extrabold text-lg text-emerald-300 uppercase tracking-wider">
                        2nd innings complete
                      </h3>
                      <p className="text-sm text-subtext">Confirm to finalize the match result.</p>
                      <button
                        type="button"
                        onClick={handleEndMatch}
                        disabled={loading}
                        className="w-full max-w-md mx-auto bg-red-500 text-white font-black px-8 py-4 rounded-xl disabled:opacity-50"
                      >
                        End Match
                      </button>
                    </div>
                  ) : isLiveScoring ? (
                  <>
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2, 3, 4, 6].map((runs) => (
                        <button
                          key={runs}
                          type="button"
                          onClick={() => submitQuickBall(runs)}
                          disabled={loading}
                          className="bg-card hover:bg-background border border-border py-4 rounded-xl font-black text-lg text-text disabled:opacity-50"
                        >
                          {runs === 0 ? "•" : runs}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      {[
                        { label: "Wide", extraType: "wide" },
                        { label: "No Ball", extraType: "noball" },
                        { label: "Bye", extraType: "bye" },
                        { label: "Leg Bye", extraType: "legbye" },
                        { label: "Bowled", wicketType: "bowled" },
                      ].map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => submitQuickBall(0, action.extraType || null, action.wicketType || null)}
                          disabled={loading}
                          className="bg-background border border-border py-3 rounded-xl font-bold text-sm text-text disabled:opacity-50"
                        >
                          {action.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={openCaughtModal}
                        disabled={loading}
                        className="bg-background border border-border py-3 rounded-xl font-bold text-sm text-text disabled:opacity-50"
                      >
                        Caught
                      </button>
                      <button
                        type="button"
                        onClick={openRunOutModal}
                        disabled={loading}
                        className="bg-red-500/15 border border-red-500/40 py-3 rounded-xl font-bold text-sm text-red-400 disabled:opacity-50"
                      >
                        Run Out
                      </button>
                    </div>
                  </div>

                  <form onSubmit={submitAdvancedDelivery} className="bg-background border border-border rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-accent">Advanced Delivery</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Runs Off Bat" type="number" value={String(advancedDelivery.runs)} onChange={(value) => setAdvancedDelivery((current) => ({ ...current, runs: value }))} />
                      <SelectField
                        label="Extra Type"
                        value={advancedDelivery.extraType}
                        onChange={(value) => setAdvancedDelivery((current) => ({ ...current, extraType: value }))}
                        options={[
                          { value: "", label: "None" },
                          { value: "wide", label: "Wide" },
                          { value: "noball", label: "No Ball" },
                          { value: "bye", label: "Bye" },
                          { value: "legbye", label: "Leg Bye" },
                        ]}
                      />
                      <Field label="Extra Runs" type="number" value={String(advancedDelivery.extraRuns)} onChange={(value) => setAdvancedDelivery((current) => ({ ...current, extraRuns: value }))} />
                      <SelectField
                        label="Wicket Type"
                        value={advancedDelivery.wicketType}
                        onChange={(value) => setAdvancedDelivery((current) => ({ ...current, wicketType: value }))}
                        options={[
                          { value: "", label: "None" },
                          { value: "bowled", label: "Bowled" },
                          { value: "caught", label: "Caught" },
                          { value: "runout", label: "Run Out" },
                          { value: "lbw", label: "LBW" },
                          { value: "stumped", label: "Stumped" },
                          { value: "retired_out", label: "Retired Out" },
                          { value: "hit_wicket", label: "Hit Wicket" },
                        ]}
                      />
                      <SelectField
                        label="Dismissed Player"
                        value={advancedDelivery.dismissedPlayerId}
                        onChange={(value) => setAdvancedDelivery((current) => ({ ...current, dismissedPlayerId: value }))}
                        options={selectedMatch.currentInningsState?.batsmen?.filter((player) => player.status === "batting").map((player) => ({ value: player.playerId.toString(), label: player.name })) || []}
                      />
                      {advancedDelivery.wicketType === "caught" && (
                        <SelectField
                          label="Fielder (Caught By)"
                          value={advancedDelivery.fielderId}
                          onChange={(value) => setAdvancedDelivery((current) => ({ ...current, fielderId: value }))}
                          options={fieldingPlayers.map((player) => ({
                            value: player.id.toString(),
                            label: player.name,
                          }))}
                        />
                      )}
                      <SelectField
                        label="Next Batter"
                        value={advancedDelivery.nextBatterId}
                        onChange={(value) => setAdvancedDelivery((current) => ({ ...current, nextBatterId: value }))}
                        options={[
                          { value: "", label: "Auto" },
                          ...((selectedMatch.availableNextBatters || []).map((player) => ({ value: player.playerId.toString(), label: player.name }))),
                        ]}
                      />
                      <SelectField
                        label="Active Bowler"
                        value={advancedDelivery.bowlerId}
                        onChange={(value) => setAdvancedDelivery((current) => ({ ...current, bowlerId: value }))}
                        options={selectedMatch.availableBowlers?.map((player) => ({ value: player.playerId.toString(), label: player.name })) || []}
                      />
                      <SelectField
                        label="Next Over Bowler"
                        value={advancedDelivery.nextBowlerId}
                        onChange={(value) => setAdvancedDelivery((current) => ({ ...current, nextBowlerId: value }))}
                        options={[
                          { value: "", label: "Keep Current" },
                          ...((selectedMatch.availableBowlers || []).map((player) => ({ value: player.playerId.toString(), label: player.name }))),
                        ]}
                      />
                    </div>

                    <button type="submit" disabled={loading} className="bg-accent text-black font-black px-5 py-3 rounded-lg disabled:opacity-50">
                      Submit Delivery
                    </button>
                  </form>
                  </>
                  ) : (
                    <p className="text-sm text-subtext text-center py-6">Start an innings to begin live scoring.</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-subtext">Select a fixture from the header to set up or score a match.</p>
              )}
          </section>
        </>
      )}
    </div>
  );
}

function serializeTeamForApi(team) {
  return {
    name: team.name,
    companyName: team.companyName,
    jerseyColor: team.jerseyColor,
    players: team.players
      .filter((player) => player.name.trim())
      .map((player) => ({
        name: player.name.trim(),
        jerseyNumber: Number(player.jerseyNumber || 0) || null,
        battingStyle: player.battingStyle || null,
        bowlingStyle: player.bowlingStyle || null,
        isCaptain: player.isCaptain,
        isWicketKeeper: player.isWicketKeeper,
      })),
  };
}

function lineupForTeam(match, teamId) {
  if (!match?.liveData?.lineups) return null;
  if (match.liveData.lineups.team1?.teamId?.toString() === teamId?.toString()) return match.liveData.lineups.team1;
  if (match.liveData.lineups.team2?.teamId?.toString() === teamId?.toString()) return match.liveData.lineups.team2;
  return null;
}

function teamNameForId(match, teamId) {
  if (!match || !teamId) return "";
  if (match.liveData.lineups.team1?.teamId?.toString() === teamId?.toString()) return match.team1Name;
  if (match.liveData.lineups.team2?.teamId?.toString() === teamId?.toString()) return match.team2Name;
  return "";
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-subtext uppercase font-bold">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-sm text-text focus-visible:outline"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, disabled = false }) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-subtext uppercase font-bold">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-sm text-text focus-visible:outline disabled:opacity-50"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TeamRosterEditor({ title, team, onChange }) {
  function updatePlayer(index, key, value) {
    const nextPlayers = team.players.map((player, playerIndex) => {
      if (playerIndex !== index) return player;

      if (key === "isCaptain" && value) {
        return { ...player, isCaptain: true };
      }
      if (key === "isWicketKeeper" && value) {
        return { ...player, isWicketKeeper: true };
      }

      return { ...player, [key]: value };
    }).map((player, playerIndex) => {
      if (key === "isCaptain" && value && playerIndex !== index) {
        return { ...player, isCaptain: false };
      }
      if (key === "isWicketKeeper" && value && playerIndex !== index) {
        return { ...player, isWicketKeeper: false };
      }
      return player;
    });

    onChange({ ...team, players: nextPlayers });
  }

  return (
    <div className="space-y-4 border border-border rounded-2xl p-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-accent">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Team Name" value={team.name} onChange={(value) => onChange({ ...team, name: value })} />
        <Field label="Company Name" value={team.companyName} onChange={(value) => onChange({ ...team, companyName: value })} />
        <Field label="Jersey Color" value={team.jerseyColor} onChange={(value) => onChange({ ...team, jerseyColor: value })} />
      </div>

      <div className="space-y-3">
        {team.players.map((player, index) => (
          <div key={`${title}-${index}`} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-background border border-border rounded-xl p-3">
            <Field label={`Player ${index + 1}`} value={player.name} onChange={(value) => updatePlayer(index, "name", value)} />
            <Field label="Jersey" type="number" value={String(player.jerseyNumber ?? "")} onChange={(value) => updatePlayer(index, "jerseyNumber", value)} />
            <Field label="Batting" value={player.battingStyle} onChange={(value) => updatePlayer(index, "battingStyle", value)} placeholder="Right-hand bat" />
            <Field label="Bowling" value={player.bowlingStyle} onChange={(value) => updatePlayer(index, "bowlingStyle", value)} placeholder="Right-arm medium" />
            <label className="text-xs text-subtext uppercase font-bold flex items-center gap-2">
              <input type="radio" checked={player.isCaptain} onChange={() => updatePlayer(index, "isCaptain", true)} />
              Captain
            </label>
            <label className="text-xs text-subtext uppercase font-bold flex items-center gap-2">
              <input type="radio" checked={player.isWicketKeeper} onChange={() => updatePlayer(index, "isWicketKeeper", true)} />
              Wicket Keeper
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScorecardCard({ title, player }) {
  return (
    <div className="bg-background/40 rounded-lg p-4 border border-white/5">
      <div className="text-[10px] uppercase text-subtext font-bold">{title}</div>
      <div className="text-text font-bold mt-1">{player?.name || "TBD"}</div>
      <div className="text-xs text-subtext mt-2">
        {player
          ? `${player.runs} (${player.balls}) • SR ${formatStrikeRate(player.strikeRate)}`
          : "Awaiting setup"}
      </div>
    </div>
  );
}

function BowlerCard({ title, player }) {
  return (
    <div className="bg-background/40 rounded-lg p-4 border border-white/5">
      <div className="text-[10px] uppercase text-subtext font-bold">{title}</div>
      <div className="text-text font-bold mt-1">{player?.name || "TBD"}</div>
      <div className="text-xs text-subtext mt-2">
        {player ? `${player.overs} ov • ${player.runs} runs • ${player.wickets} wkts` : "Awaiting setup"}
      </div>
    </div>
  );
}
