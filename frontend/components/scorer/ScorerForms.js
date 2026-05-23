"use client";

export function buildEmptyPlayer(index) {
  return {
    name: "",
    jerseyNumber: index + 1,
    battingStyle: "",
    bowlingStyle: "",
    isCaptain: index === 0,
    isWicketKeeper: index === 0,
  };
}

export function buildEmptyTeam(prefix, playerCount = 11) {
  const size = Math.max(1, Math.min(15, Number(playerCount) || 11));
  return {
    name: "",
    companyName: "",
    jerseyColor: "",
    players: Array.from({ length: size }, (_, index) => buildEmptyPlayer(index)),
    prefix,
  };
}

export function resizeTeamRoster(team, playerCount) {
  const size = Math.max(1, Math.min(15, Number(playerCount) || 11));
  if (team.players.length === size) return team;
  if (team.players.length > size) {
    return { ...team, players: team.players.slice(0, size) };
  }
  const extra = Array.from({ length: size - team.players.length }, (_, index) =>
    buildEmptyPlayer(team.players.length + index),
  );
  return { ...team, players: [...team.players, ...extra] };
}

export function serializeTeamForApi(team) {
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

function Field({ label, value, onChange, type = "text", inputMode, readOnly = false }) {
  return (
    <label className="space-y-2 text-xs font-bold uppercase text-subtext block">
      {label}
      <input
        type={type}
        inputMode={inputMode}
        readOnly={readOnly}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-sm text-text font-normal normal-case disabled:opacity-70 disabled:cursor-not-allowed"
      />
    </label>
  );
}

function NumericTextField({ label, value, onChange, min = 1, max = 50 }) {
  return (
    <label className="space-y-2 text-xs font-bold uppercase text-subtext block">
      {label}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          if (digits === "") {
            onChange("");
            return;
          }
          const n = Math.min(max, Math.max(min, Number(digits)));
          onChange(String(n));
        }}
        className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-sm text-text font-normal normal-case [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </label>
  );
}

function DateField({ label, value, onChange }) {
  return (
    <label className="space-y-2 text-xs font-bold uppercase text-subtext block">
      {label}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-sm text-text font-normal normal-case cursor-pointer"
      />
    </label>
  );
}

function DateTimeField({ label, value, onChange }) {
  return (
    <label className="space-y-2 text-xs font-bold uppercase text-subtext block">
      {label}
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-sm text-text font-normal normal-case cursor-pointer"
      />
    </label>
  );
}

export function TournamentFormFields({ form, setForm }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Name" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} />
      <label className="space-y-2 text-xs font-bold uppercase text-subtext">
        Format
        <select
          value={form.type}
          onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))}
          className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-sm font-normal normal-case"
        >
          <option value="leather_ball">Leather Ball</option>
          <option value="box_cricket">Box Cricket</option>
          <option value="turf_cricket">Turf Cricket</option>
          <option value="indoor_cricket">Indoor Cricket</option>
        </select>
      </label>
      <Field label="Prize Money" value={form.prizeMoney} onChange={(v) => setForm((c) => ({ ...c, prizeMoney: v }))} />
      <Field label="Ground" value={form.groundName} onChange={(v) => setForm((c) => ({ ...c, groundName: v }))} />
      <DateField label="Start Date" value={form.startDate} onChange={(v) => setForm((c) => ({ ...c, startDate: v }))} />
      <DateField label="End Date" value={form.endDate} onChange={(v) => setForm((c) => ({ ...c, endDate: v }))} />
      <NumericTextField
        label="Overs"
        value={String(form.overs ?? "")}
        onChange={(v) => setForm((c) => ({ ...c, overs: v === "" ? "" : Number(v) }))}
        min={1}
        max={50}
      />
      <NumericTextField
        label="Players / Team"
        value={String(form.playersPerTeam ?? "")}
        onChange={(v) => setForm((c) => ({ ...c, playersPerTeam: v === "" ? "" : Number(v) }))}
        min={2}
        max={15}
      />
    </div>
  );
}

export function FriendlyFormFields({ form, setForm, isEdit }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
      <Field label="Match Title" value={form.title} onChange={(v) => setForm((c) => ({ ...c, title: v }))} />
      <Field label="Venue" value={form.ground} onChange={(v) => setForm((c) => ({ ...c, ground: v }))} />
      <DateTimeField label="Date & Time" value={form.matchDate} onChange={(v) => setForm((c) => ({ ...c, matchDate: v }))} />
      <NumericTextField
        label="Overs"
        value={String(form.overs ?? "")}
        onChange={(v) => setForm((c) => ({ ...c, overs: v === "" ? "" : Number(v) }))}
        min={1}
        max={50}
      />
      {!isEdit && (
        <NumericTextField
          label="Players / Team"
          value={String(form.playersPerTeam ?? "")}
          onChange={(v) => setForm((c) => ({ ...c, playersPerTeam: v === "" ? "" : Number(v) }))}
          min={2}
          max={15}
        />
      )}
      {isEdit && (
        <p className="md:col-span-2 text-xs text-subtext">Team rosters cannot be edited after creation. Delete and recreate if needed.</p>
      )}
    </div>
  );
}

export function TeamRosterEditor({ title, team, onChange }) {
  function updatePlayer(index, key, value) {
    const nextPlayers = team.players.map((player, playerIndex) => {
      if (playerIndex !== index) {
        if (key === "isCaptain" && value) return { ...player, isCaptain: false };
        if (key === "isWicketKeeper" && value) return { ...player, isWicketKeeper: false };
        return player;
      }
      if (key === "isCaptain" && value) return { ...player, isCaptain: true };
      if (key === "isWicketKeeper" && value) return { ...player, isWicketKeeper: true };
      return { ...player, [key]: value };
    });
    onChange({ ...team, players: nextPlayers });
  }

  return (
    <div className="space-y-4 border border-border rounded-2xl p-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-accent">
        {title} <span className="text-subtext font-normal">({team.players.length} players)</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Team Name" value={team.name} onChange={(v) => onChange({ ...team, name: v })} />
        <Field label="Company" value={team.companyName} onChange={(v) => onChange({ ...team, companyName: v })} />
        <Field label="Jersey" value={team.jerseyColor} onChange={(v) => onChange({ ...team, jerseyColor: v })} />
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {team.players.map((player, index) => (
          <div key={`${title}-${index}`} className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-background border border-border rounded-lg p-2">
            <Field label={`#${index + 1}`} value={player.name} onChange={(v) => updatePlayer(index, "name", v)} />
            <label className="flex items-center gap-2 text-xs font-bold text-subtext pt-6">
              <input type="radio" checked={player.isCaptain} onChange={() => updatePlayer(index, "isCaptain", true)} />
              C
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-subtext pt-6">
              <input type="radio" checked={player.isWicketKeeper} onChange={() => updatePlayer(index, "isWicketKeeper", true)} />
              WK
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScheduleMatchFields({ fixtureForm, setFixtureForm, tournamentName, tournamentLocked }) {
  return (
    <>
      <label className="space-y-2 text-xs font-bold uppercase text-subtext block max-w-md">
        Tournament
        {tournamentLocked ? (
          <div
            className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-sm text-text font-bold normal-case select-none"
            aria-readonly="true"
          >
            {tournamentName || "Tournament"}
          </div>
        ) : (
          <span className="text-[10px] text-red-400 font-normal normal-case block">Select a tournament from the dashboard.</span>
        )}
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <DateTimeField
          label="Date & Time"
          value={fixtureForm.matchDate}
          onChange={(v) => setFixtureForm((c) => ({ ...c, matchDate: v }))}
        />
        <Field label="Venue" value={fixtureForm.ground} onChange={(v) => setFixtureForm((c) => ({ ...c, ground: v }))} />
      </div>
    </>
  );
}
