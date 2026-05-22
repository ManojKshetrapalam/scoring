"use client";

import { useState } from "react";
import { Trophy, Calendar, MapPin, Users, Send, CheckCircle2, ShieldAlert, Award, FileText } from "lucide-react";

export default function AdminConsole() {
  const [newTournament, setNewTournament] = useState({
    name: "",
    type: "leather_ball",
    prize: "",
    venue: "",
    overs: "20"
  });

  const [pendingRegistrations, setPendingRegistrations] = useState([
    { id: 1, team: "Amazon Aces", company: "Amazon Retail", manager: "Bruce Wayne", email: "bruce@amazon.com", bracket: "Corporate Cup", price: "₹15,000" },
    { id: 2, team: "Adobe Avengers", company: "Adobe Systems", manager: "Tony Stark", email: "tony@adobe.com", bracket: "Turf Box League", price: "₹8,000" }
  ]);

  const [schedules, setSchedules] = useState([
    { id: 1, team1: "Google Giants", team2: "Microsoft Mavericks", date: "June 22, 2026", ground: "Main Pitch" },
    { id: 2, team1: "Meta Masters", team2: "Microsoft Mavericks", date: "June 23, 2026", ground: "Pitch B" }
  ]);

  const [announcement, setAnnouncement] = useState("");
  const [scheduleForm, setScheduleForm] = useState({ team1: "Google Giants", team2: "Microsoft Mavericks", date: "", ground: "Main Pitch" });

  const handleCreateTournament = (e) => {
    e.preventDefault();
    if (!newTournament.name || !newTournament.venue) {
      alert("Please enter a name and venue.");
      return;
    }
    alert(`Tournament "${newTournament.name}" initialized successfully!`);
    setNewTournament({ name: "", type: "leather_ball", prize: "", venue: "", overs: "20" });
  };

  const handleApprove = (id, teamName) => {
    setPendingRegistrations(prev => prev.filter(r => r.id !== id));
    alert(`Team "${teamName}" approved and notified! Account login credentials issued.`);
  };

  const handleBroadcast = (e) => {
    e.preventDefault();
    if (!announcement) return;
    alert(`System Announcement broadcasted: "${announcement}"`);
    setAnnouncement("");
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!scheduleForm.date) return;
    setSchedules(prev => [
      ...prev,
      {
        id: Date.now(),
        team1: scheduleForm.team1,
        team2: scheduleForm.team2,
        date: scheduleForm.date,
        ground: scheduleForm.ground
      }
    ]);
    alert("Match scheduled successfully!");
    setScheduleForm({ team1: "Google Giants", team2: "Microsoft Mavericks", date: "", ground: "Main Pitch" });
  };

  return (
    <div className="space-y-8">
      {/* HEADER SUMMARY */}
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold font-display tracking-tight">Super Admin Dashboard</h1>
        <p className="text-subtext text-xs sm:text-sm">
          Coordinate registrations, schedule fixtures, initialize championships, and broadcast real-time announcements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Approvals and Announcements */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* TEAM REGISTRATION APPROVAL QUEUE */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              Roster Approvals Queue
            </h3>
            
            {pendingRegistrations.length === 0 ? (
              <p className="text-xs text-subtext bg-background p-4 rounded-xl border border-border text-center">
                All team registrations have been processed.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingRegistrations.map((reg) => (
                  <div key={reg.id} className="bg-background border border-border p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-text">{reg.team}</span>
                        <span className="text-[10px] text-accent font-bold">({reg.bracket})</span>
                      </div>
                      <p className="text-subtext">{reg.company} • Manager: {reg.manager} ({reg.email})</p>
                      <span className="bg-card border border-border px-2 py-0.5 rounded text-[9px] text-accent font-extrabold">
                        Payment: {reg.price} cleared
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => handleApprove(reg.id, reg.team)}
                      className="bg-accent hover:bg-accent-hover text-black font-extrabold px-4 py-2 rounded-lg transition-all focus-visible:outline"
                    >
                      Approve Team
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FIXTURE SCHEDULING WIZARD */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-bold font-display flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Fixture Coordinator Scheduler
            </h3>

            <form onSubmit={handleScheduleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <label className="text-[10px] text-subtext uppercase font-bold">Team 1</label>
                <select 
                  value={scheduleForm.team1} 
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, team1: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 rounded-lg text-text focus-visible:outline"
                >
                  <option value="Google Giants">Google Giants</option>
                  <option value="Microsoft Mavericks">Microsoft Mavericks</option>
                  <option value="Meta Masters">Meta Masters</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-subtext uppercase font-bold">Team 2</label>
                <select 
                  value={scheduleForm.team2} 
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, team2: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 rounded-lg text-text focus-visible:outline"
                >
                  <option value="Microsoft Mavericks">Microsoft Mavericks</option>
                  <option value="Google Giants">Google Giants</option>
                  <option value="Meta Masters">Meta Masters</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-subtext uppercase font-bold">Match Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={scheduleForm.date} 
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 rounded-lg text-text focus-visible:outline"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-subtext uppercase font-bold">Ground Allocation</label>
                <select 
                  value={scheduleForm.ground} 
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, ground: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 rounded-lg text-text focus-visible:outline"
                >
                  <option value="Main Pitch">Main Pitch Stadium</option>
                  <option value="Pitch B">Stadium Pitch B</option>
                  <option value="Turf Court 1">Turf Arena Court 1</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="sm:col-span-2 bg-accent hover:bg-accent-hover text-black font-extrabold py-2.5 rounded-lg transition-all focus-visible:outline"
              >
                Generate Scheduled Fixture
              </button>
            </form>

            {/* List of active schedules */}
            <div className="border-t border-border/40 pt-4 space-y-2">
              <span className="text-[10px] text-subtext uppercase font-bold">Active Fixtures Calendar</span>
              {schedules.map((sch) => (
                <div key={sch.id} className="bg-background p-3 rounded-lg border border-border flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold">{sch.team1} vs {sch.team2}</p>
                    <span className="text-[10px] text-subtext">{sch.date} • {sch.ground}</span>
                  </div>
                  <span className="text-[10px] text-accent uppercase font-bold">Approved</span>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Right Side: Create Tournament and Announcements */}
        <div className="space-y-8">
          
          {/* TOURNAMENT INITIALIZATION WIZARD */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-6">
            <h3 className="text-lg font-bold font-display flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              Tournament Wizard
            </h3>

            <form onSubmit={handleCreateTournament} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="text-[10px] text-subtext uppercase font-bold">Tournament Name</label>
                <input 
                  type="text" 
                  value={newTournament.name}
                  onChange={(e) => setNewTournament(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Gevents IT Cup 2026"
                  className="w-full bg-background border border-border px-3 py-2 rounded-lg text-text focus-visible:outline"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-subtext uppercase font-bold">Format Type</label>
                <select 
                  value={newTournament.type}
                  onChange={(e) => setNewTournament(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-background border border-border px-3 py-2 rounded-lg text-text focus-visible:outline"
                >
                  <option value="leather_ball">Leather Ball Cricket</option>
                  <option value="box_cricket">Box Cricket Turf</option>
                  <option value="turf_cricket">Open Turf Cricket</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-subtext uppercase font-bold">Venue Arena</label>
                <input 
                  type="text" 
                  value={newTournament.venue}
                  onChange={(e) => setNewTournament(prev => ({ ...prev, venue: e.target.value }))}
                  placeholder="Baner, Pune"
                  className="w-full bg-background border border-border px-3 py-2 rounded-lg text-text focus-visible:outline"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-accent hover:bg-accent-hover text-black font-extrabold py-2.5 rounded-lg transition-all focus-visible:outline"
              >
                Create Tournament Bracket
              </button>
            </form>
          </div>

          {/* GLOBAL SYSTEM ANNOUNCEMENT */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-accent tracking-wider flex items-center gap-1.5">
              <Send className="w-4 h-4" />
              Broadcast Announcements
            </h3>
            <form onSubmit={handleBroadcast} className="space-y-3 text-xs">
              <textarea 
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="Type real-time alerts (e.g. Toss starts in 10 mins)..." 
                rows="3"
                className="w-full bg-background border border-border p-3 rounded-lg text-text focus-visible:outline placeholder-subtext"
                required
              />
              <button 
                type="submit"
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-text border border-border py-2.5 rounded-lg font-bold transition-all focus-visible:outline uppercase tracking-wider text-[10px]"
              >
                Broadcast via WebSocket
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
