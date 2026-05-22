"use client";

import { useState } from "react";
import { Award, ShieldAlert, CreditCard, QrCode, CheckCircle2, ShieldCheck, Mail } from "lucide-react";

export default function TeamRegistration() {
  const [formData, setFormData] = useState({
    teamName: "",
    companyName: "",
    managerName: "",
    mobileNumber: "",
    email: "",
    tournamentId: "1",
    jerseyColor: "Neon Green / Black",
    playerCount: 11
  });

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending, processing, completed
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.teamName || !formData.companyName || !formData.managerName || !formData.email) {
      alert("Please fill all mandatory corporate details.");
      return;
    }
    // Launch dynamic payment simulated checkout drawer
    setPaymentOpen(true);
  };

  const simulatePaymentSuccess = () => {
    setPaymentStatus("processing");
    setTimeout(() => {
      setPaymentStatus("completed");
      setTimeout(() => {
        setPaymentOpen(false);
        setShowSuccess(true);
      }, 1000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* HEADER TITLE */}
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold font-display tracking-tight text-center sm:text-left">
          Register Corporate Team
        </h1>
        <p className="text-subtext text-xs sm:text-sm text-center sm:text-left">
          Register your company team for our premium Box, Turf, or Leather Ball leagues. Complete the checkout to receive auto manager credentials.
        </p>
      </div>

      {/* FORM AND INFORMATION PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main form */}
        <form onSubmit={handleFormSubmit} className="lg:col-span-2 bg-card border border-border p-6 sm:p-8 rounded-2xl space-y-6">
          <h2 className="text-lg font-bold font-display border-b border-border pb-2">Roster & Contact Info</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="teamName" className="text-xs text-subtext uppercase font-bold">Team Name *</label>
              <input 
                type="text" 
                name="teamName" 
                id="teamName"
                value={formData.teamName} 
                onChange={handleInputChange} 
                placeholder="e.g., Google Giants"
                className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-xs text-text focus-visible:outline focus:border-accent"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="companyName" className="text-xs text-subtext uppercase font-bold">Company Name *</label>
              <input 
                type="text" 
                name="companyName" 
                id="companyName"
                value={formData.companyName} 
                onChange={handleInputChange} 
                placeholder="e.g., Google India Pvt Ltd"
                className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-xs text-text focus-visible:outline focus:border-accent"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="managerName" className="text-xs text-subtext uppercase font-bold">Manager Name *</label>
              <input 
                type="text" 
                name="managerName" 
                id="managerName"
                value={formData.managerName} 
                onChange={handleInputChange} 
                placeholder="John Doe"
                className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-xs text-text focus-visible:outline focus:border-accent"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-xs text-subtext uppercase font-bold">Corporate Email *</label>
              <input 
                type="email" 
                name="email" 
                id="email"
                value={formData.email} 
                onChange={handleInputChange} 
                placeholder="john.doe@google.com"
                className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-xs text-text focus-visible:outline focus:border-accent"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="mobileNumber" className="text-xs text-subtext uppercase font-bold">Mobile Number</label>
              <input 
                type="tel" 
                name="mobileNumber" 
                id="mobileNumber"
                value={formData.mobileNumber} 
                onChange={handleInputChange} 
                placeholder="+91 98765 43210"
                className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-xs text-text focus-visible:outline"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="tournamentId" className="text-xs text-subtext uppercase font-bold">Select Bracket *</label>
              <select 
                name="tournamentId" 
                id="tournamentId"
                value={formData.tournamentId}
                onChange={handleInputChange}
                className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-xs text-text focus-visible:outline"
              >
                <option value="1">Gevents Corporate Cricket Cup 2026</option>
                <option value="2">Baner Corporate Turf Box League</option>
              </select>
            </div>
          </div>

          <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="jerseyColor" className="text-xs text-subtext uppercase font-bold">Jersey Colors (Preferred)</label>
              <input 
                type="text" 
                name="jerseyColor" 
                id="jerseyColor"
                value={formData.jerseyColor} 
                onChange={handleInputChange} 
                className="w-full bg-background border border-border px-4 py-2.5 rounded-lg text-xs text-text focus-visible:outline"
              />
            </div>

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
            className="w-full bg-accent hover:bg-accent-hover text-black font-extrabold py-3.5 rounded-lg text-sm transition-all focus-visible:outline shadow-md"
          >
            Proceed to Payment Verification
          </button>
        </form>

        {/* Sidebar help */}
        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
            <h3 className="font-extrabold text-sm uppercase text-accent tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Registration Details
            </h3>
            <ul className="space-y-3 text-xs text-subtext leading-relaxed">
              <li>• Registration includes entry fee, customized jerseys, and a visual digital profile page for all team members.</li>
              <li>• Automated scorer allocation by Gevents and immediate dynamic updates.</li>
              <li>• Access keys and Android/iOS Mobile App installation tokens will be issued immediately upon payment clearance.</li>
            </ul>
          </div>
        </div>

      </div>

      {/* 3. PAYMENT MOCK DIALOG DRAWERS */}
      {paymentOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="bg-card border border-border max-w-md w-full rounded-2xl overflow-hidden shadow-2xl p-6 space-y-6 animate-scale-up">
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold font-display">Gevents Checkout Portal</h3>
              <p className="text-xs text-subtext">Choose a secure demo payment gateway to clear registrations</p>
            </div>

            <div className="border border-border p-4 rounded-xl space-y-3 bg-background text-xs">
              <div className="flex justify-between">
                <span className="text-subtext">Tournament Entry:</span>
                <span className="font-bold">{formData.tournamentId === "1" ? "Corporate Cup" : "Turf Box League"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtext">Amount Due:</span>
                <span className="font-extrabold text-accent">{formData.tournamentId === "1" ? "₹15,000" : "₹8,000"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border border-border p-3 rounded-lg text-center bg-background cursor-pointer hover:border-accent transition-all flex flex-col items-center justify-center gap-2">
                <QrCode className="w-6 h-6 text-accent" />
                <span className="text-[10px] font-bold text-text uppercase">UPI QR Code</span>
              </div>
              <div className="border border-border p-3 rounded-lg text-center bg-background cursor-pointer hover:border-accent transition-all flex flex-col items-center justify-center gap-2">
                <CreditCard className="w-6 h-6 text-accent" />
                <span className="text-[10px] font-bold text-text uppercase">Razorpay Card</span>
              </div>
            </div>

            <button 
              onClick={simulatePaymentSuccess}
              disabled={paymentStatus === "processing"}
              className="w-full bg-accent hover:bg-accent-hover text-black font-extrabold py-3 rounded-lg text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {paymentStatus === "pending" && "Simulate Successful Payment"}
              {paymentStatus === "processing" && "Processing Transaction..."}
              {paymentStatus === "completed" && "Transaction Confirmed!"}
            </button>

            <button 
              onClick={() => setPaymentOpen(false)}
              className="w-full text-center text-xs text-subtext hover:text-text transition-colors"
            >
              Cancel Registration
            </button>

          </div>
        </div>
      )}

      {/* 4. SUCCESS SUCCESS DIALOG MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="bg-card border border-[#276F43] max-w-md w-full rounded-2xl overflow-hidden shadow-2xl p-6 text-center space-y-6">
            
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-[#1C3A27] flex items-center justify-center text-accent">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display text-text">Team Registered!</h3>
              <p className="text-xs text-subtext">
                Your payment of <span className="text-accent font-bold">{formData.tournamentId === "1" ? "₹15,000" : "₹8,000"}</span> was successfully received and validated by Gevents.
              </p>
            </div>

            <div className="bg-background border border-border p-4 rounded-xl text-xs space-y-3 text-left">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <p className="font-bold text-text">Credentials Dispatched</p>
                  <p className="text-subtext">An autogenerated OTP passcode instructions guide was sent to <span className="text-text font-semibold">{formData.email}</span>.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent mt-0.5" />
                <div>
                  <p className="font-bold text-text">App Store Installers</p>
                  <p className="text-subtext">The download keys for the Gevents Unlimited Android + iOS App were issued.</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowSuccess(false)}
              className="w-full bg-accent hover:bg-accent-hover text-black font-extrabold py-3 rounded-lg text-xs uppercase"
            >
              Back to Home
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
