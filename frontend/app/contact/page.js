"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    format: "leather",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        format: "leather",
        message: "",
      });
    }, 1200);
  };

  const handleReset = () => {
    setSubmitted(false);
  };

  return (
    <article className="max-w-5xl mx-auto space-y-12 animate-fade-in" aria-labelledby="contact-heading">
      
      {/* HEADER */}
      <header className="text-center space-y-4 pb-6 border-b border-border">
        <span className="text-accent text-xs font-bold tracking-widest uppercase bg-accent bg-opacity-10 px-3 py-1.5 rounded-full">
          Get In Touch
        </span>
        <h1 id="contact-heading" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
          Contact Gevents Cricket
        </h1>
        <p className="text-subtext text-sm max-w-xl mx-auto">
          Need a corporate turf booked, custom sound system set up, or a leather-ball tournament staged? Let's team up.
        </p>
      </header>

      {/* THREE CARDS CONTACT INFO */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 font-display" aria-label="Contact Channels">
        <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent bg-opacity-10 text-accent flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs text-subtext uppercase tracking-widest font-semibold">Call Support</h2>
            <a href="tel:+919403890373" className="text-base font-bold text-text hover:text-accent focus-visible:outline">
              +91 940 38 903 73
            </a>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent bg-opacity-10 text-accent flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs text-subtext uppercase tracking-widest font-semibold">Email Sales</h2>
            <a href="mailto:info@geventsunlimited.com" className="text-base font-bold text-text hover:text-accent focus-visible:outline">
              info@geventsunlimited.com
            </a>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent bg-opacity-10 text-accent flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs text-subtext uppercase tracking-widest font-semibold">Headquarters</h2>
            <span className="text-sm font-bold text-text">
              Pune - Mumbai, Maharashtra, India
            </span>
          </div>
        </div>
      </section>

      {/* FORM AND TIMING AREA */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* LEFT COLUMN - CONTACT INFO */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl space-y-6">
            <h2 className="text-xl font-bold text-text tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Response Timelines
            </h2>
            <p className="text-xs sm:text-sm text-subtext leading-relaxed">
              We monitor corporate booking channels and scorer accounts constantly. Standard feedback delivery details are as follows:
            </p>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-subtext">Tournament Registrations</span>
                <span className="font-semibold text-accent">Under 1 Hour</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-subtext">Sponsorship & Staging Deals</span>
                <span className="font-semibold text-text">Within 4 Hours</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-subtext">Scorer Certification & Accounts</span>
                <span className="font-semibold text-text">Within 12 Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-subtext">General Inquiries</span>
                <span className="font-semibold text-text">Same Business Day</span>
              </div>
            </div>
            <div className="p-4 bg-card rounded-lg border border-border space-y-2">
              <span className="block text-xs font-bold text-text">Urgently Hosting?</span>
              <p className="text-[11px] text-subtext">
                For prompt staging, turf lighting setup, or commentary team dispatches, call our priority event director at <a href="tel:+919403890373" className="text-accent underline font-semibold focus-visible:outline">+91 940 38 903 73</a>.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - CONTACT FORM */}
        <div className="lg:col-span-3">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl">
            {submitted ? (
              <div className="text-center py-12 space-y-6">
                <div className="w-16 h-16 rounded-full bg-accent bg-opacity-10 text-accent flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-text">Message Dispatched!</h2>
                  <p className="text-sm text-subtext max-w-sm mx-auto">
                    Thanks for reaching out to Gevents Unlimited Cricket. A league coordinator will contact you via email or phone shortly.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="bg-accent hover:bg-accent-hover text-black font-bold text-xs px-6 py-2.5 rounded-lg transition-all focus-visible:outline"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" aria-label="Contact Event Team Form">
                <h2 className="text-xl font-bold text-text tracking-tight">Send a Direct Message</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="contact-name" className="block text-xs font-bold uppercase tracking-wider text-text">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="contact-name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-card border border-border focus:border-accent text-text rounded-lg px-4 py-2.5 text-sm focus-visible:outline transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contact-email" className="block text-xs font-bold uppercase tracking-wider text-text">
                      Corporate Email
                    </label>
                    <input
                      type="email"
                      id="contact-email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. r.sharma@tata.com"
                      className="w-full bg-card border border-border focus:border-accent text-text rounded-lg px-4 py-2.5 text-sm focus-visible:outline transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="contact-company" className="block text-xs font-bold uppercase tracking-wider text-text">
                      Company Name
                    </label>
                    <input
                      type="text"
                      id="contact-company"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="e.g. Tata Consultancy Services"
                      className="w-full bg-card border border-border focus:border-accent text-text rounded-lg px-4 py-2.5 text-sm focus-visible:outline transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="contact-phone" className="block text-xs font-bold uppercase tracking-wider text-text">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      id="contact-phone"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 9876543210"
                      className="w-full bg-card border border-border focus:border-accent text-text rounded-lg px-4 py-2.5 text-sm focus-visible:outline transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="contact-format" className="block text-xs font-bold uppercase tracking-wider text-text">
                    Tournament / Match Format
                  </label>
                  <select
                    id="contact-format"
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="w-full bg-card border border-border focus:border-accent text-text rounded-lg px-4 py-2.5 text-sm focus-visible:outline transition-colors"
                  >
                    <option value="leather">Leather Ball Cricket Cup (Stadium Turf)</option>
                    <option value="box">Corporate Box Turf Cricket League</option>
                    <option value="indoor">Indoor Cushion Arena Match</option>
                    <option value="staging">Stage, Light & Sound Staging Setup Only</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="contact-message" className="block text-xs font-bold uppercase tracking-wider text-text">
                    Detailed Message
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows="4"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your event requirements (e.g. target date, squad size, streaming or sound requirements)"
                    className="w-full bg-card border border-border focus:border-accent text-text rounded-lg px-4 py-2.5 text-sm focus-visible:outline transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-accent hover:bg-accent-hover disabled:bg-opacity-50 text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] focus-visible:outline text-sm"
                >
                  {isSubmitting ? (
                    <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Transmit Request</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

      </section>
    </article>
  );
}
