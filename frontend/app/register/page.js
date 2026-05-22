"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { fetchApi } from "../../lib/api";

export default function TeamRegistration() {
  const [tournaments, setTournaments] = useState([]);
  const [formData, setFormData] = useState({
    teamName: "",
    companyName: "",
    managerName: "",
    mobileNumber: "",
    email: "",
    tournamentId: "",
    jerseyColor: "",
    playerCount: 11,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTournaments() {
      try {
        setLoading(true);
        const result = await fetchApi("/tournaments");
        if (!active) return;

        const activeTournaments = (result.data || []).filter((tournament) => tournament.status === "active");
        setTournaments(activeTournaments);
        setFormData((current) => ({
          ...current,
          tournamentId: current.tournamentId || activeTournaments[0]?.id?.toString() || "",
        }));
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await fetchApi(`/tournaments/${formData.tournamentId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      setSuccessMessage(result.message || "Team registered successfully.");
      setFormData((prev) => ({
        ...prev,
        teamName: "",
        companyName: "",
        managerName: "",
        mobileNumber: "",
        email: "",
        jerseyColor: "",
        playerCount: 11,
      }));
    } catch (err) {
      setError(err.message || "Failed to register team.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold font-display tracking-tight text-center sm:text-left">Register Corporate Team</h1>
        <p className="text-subtext text-xs sm:text-sm text-center sm:text-left">
          Submit your real registration details directly to the tournament backend.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleFormSubmit} className="lg:col-span-2 bg-card border border-border p-6 sm:p-8 rounded-2xl space-y-6">
          <h2 className="text-lg font-bold font-display border-b border-border pb-2">Roster & Contact Info</h2>

          {error && <div className="text-sm text-red-400">{error}</div>}
          {successMessage && (
            <div className="bg-[#1C3A27] border border-[#276F43] rounded-xl p-4 text-sm text-accent flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-subtext">Loading tournaments...</p>
          ) : tournaments.length === 0 ? (
            <p className="text-sm text-subtext">No active tournaments are open for registration right now.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Team Name *" name="teamName" value={formData.teamName} onChange={handleInputChange} required />
                <Field label="Company Name *" name="companyName" value={formData.companyName} onChange={handleInputChange} required />
                <Field label="Manager Name *" name="managerName" value={formData.managerName} onChange={handleInputChange} required />
                <Field label="Corporate Email *" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                <Field label="Mobile Number" name="mobileNumber" type="tel" value={formData.mobileNumber} onChange={handleInputChange} />

                <div className="space-y-2">
                  <label htmlFor="tournamentId" className="text-xs text-subtext uppercase font-bold">Select Tournament *</label>
                  <select
                    name="tournamentId"
                    id="tournamentId"
                    value={formData.tournamentId}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-xs text-text focus-visible:outline"
                    required
                  >
                    {tournaments.map((tournament) => (
                      <option key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Field label="Jersey Colors" name="jerseyColor" value={formData.jerseyColor} onChange={handleInputChange} />

                <div className="space-y-2">
                  <label htmlFor="playerCount" className="text-xs text-subtext uppercase font-bold">Roster Size: {formData.playerCount} Players</label>
                  <input
                    type="range"
                    name="playerCount"
                    id="playerCount"
                    min="8"
                    max="16"
                    value={formData.playerCount}
                    onChange={handleInputChange}
                    className="w-full accent-accent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-accent hover:bg-accent-hover text-black font-extrabold py-3.5 rounded-lg text-sm transition-all focus-visible:outline shadow-md disabled:opacity-50"
              >
                {submitting ? "Submitting Registration..." : "Submit Registration"}
              </button>
            </>
          )}
        </form>

        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-accent tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Registration Details
            </h3>
            <ul className="space-y-3 text-xs text-subtext leading-relaxed">
              <li>Registration data is now sent directly to the backend instead of using a simulated checkout flow.</li>
              <li>The selected tournament list comes from the live API and only shows active tournaments.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", required = false }) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-xs text-subtext uppercase font-bold">{label}</label>
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-xs text-text focus-visible:outline focus:border-accent"
        required={required}
      />
    </div>
  );
}
