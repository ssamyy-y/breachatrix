"use client";
import React from "react";
import {
  ShieldAlert,
  Terminal,
  Trophy,
  ShieldCheck,
  LogIn,
  LogOut,
  ChevronRight,
  Users,
  Lock,
  Zap,
} from "lucide-react";

import { useRouter } from "next/navigation";

export default function BreachAtTrixLanding() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-mono selection:bg-red-600/50">
      {/* Dynamic Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[60] border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShieldAlert className="text-red-600 w-8 h-8 animate-pulse" />
              <div className="absolute inset-0 blur-lg bg-red-600/50" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic">
              Breach<span className="text-red-600">@</span>Trix
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => router.push("/scoreboard")}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all hover:bg-white/5 rounded"
            >
              <Trophy size={14} className="text-yellow-500" />
              Scoreboard
            </button>
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all border border-red-500/20 rounded"
            >
              <ShieldCheck size={14} />
              Admin
            </button>
            <div className="w-[1px] h-8 bg-white/10 mx-2" />
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-red-700 transition-all skew-x-[-10deg]"
            >
              <LogIn size={14} />
              <span className="skew-x-[10deg]">Login</span>
            </button>
            <button
              onClick={() => router.push("/logout")}
              className="p-2 text-gray-600 hover:text-red-500 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Ambient Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-red-600 font-bold tracking-[0.4em] uppercase mb-4 text-xs">
              System Resurgence Initiated
            </h2>
            <h1 className="text-6xl md:text-[10rem] font-black tracking-tighter leading-none mb-4 italic uppercase">
              BREACH
              <span className="text-transparent bg-clip-text bg-gradient-to-t from-red-600 to-red-400">
                @TRIX
              </span>
            </h1>
            <div className="flex flex-wrap justify-center gap-6 text-sm uppercase tracking-widest text-gray-500 font-bold">
              <span className="flex items-center gap-2 border border-white/10 px-3 py-1 bg-white/5">
                <Users size={14} /> 4 Students / Team
              </span>
              <span className="flex items-center gap-2 border border-white/10 px-3 py-1 bg-white/5">
                <Lock size={14} /> Eligibility: IX – XII
              </span>
            </div>
          </div>

          {/* Conflict Grid */}
          <div className="grid lg:grid-cols-2 gap-px bg-white/10 border border-white/10 rounded-lg overflow-hidden shadow-2xl shadow-red-900/10">
            {/* Red Team - Attack */}
            <div className="bg-[#0a0a0a] p-8 md:p-12 relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Terminal size={120} className="text-red-600" />
              </div>
              <h3 className="text-3xl font-black text-red-600 mb-6 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-red-600" /> RED TEAM
              </h3>
              <p className="text-gray-400 mb-8 leading-relaxed italic">
                "Identify and exploit vulnerabilities. Resurgence is about minds
                empowered by machines—use them to dismantle the target."
              </p>
              <ul className="space-y-3 text-sm">
                {[
                  "SQL Injection",
                  "Cross-Site Scripting (XSS)",
                  "Auth Bypass",
                  "Ethical Exploitation",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-gray-300"
                  >
                    <ChevronRight size={14} className="text-red-600" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Blue Team - Defense */}
            <div className="bg-[#0a0a0a] p-8 md:p-12 relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck size={120} className="text-blue-600" />
              </div>
              <h3 className="text-3xl font-black text-blue-600 mb-6 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-blue-600" /> BLUE TEAM
              </h3>
              <p className="text-gray-400 mb-8 leading-relaxed italic">
                "Adapt, rebuild, and lead. Monitor attack vectors in real-time
                and secure the infrastructure against the rising threat."
              </p>
              <ul className="space-y-3 text-sm">
                {[
                  "Real-time Monitoring",
                  "Security Patching",
                  "Secure Coding",
                  "Uptime Maintenance",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-gray-300"
                  >
                    <ChevronRight size={14} className="text-blue-600" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Scoring Info */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="border border-white/5 bg-white/[0.02] p-6 rounded-lg">
              <Zap className="text-yellow-500 mb-4" />
              <h4 className="font-bold text-sm uppercase mb-2 tracking-tighter">
                Goal of Challenge
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Hands-on experience in offensive and defensive cybersecurity.
                Understand how vulnerabilities are discovered, exploited, and
                mitigated.
              </p>
            </div>
            <div className="border border-white/5 bg-white/[0.02] p-6 rounded-lg">
              <Trophy className="text-red-500 mb-4" />
              <h4 className="font-bold text-sm uppercase mb-2 tracking-tighter">
                Bonus Points
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Awarded for creative attack techniques, advanced exploitation
                methods, and clean mitigations.
              </p>
            </div>
            <div className="border border-white/5 bg-white/[0.02] p-6 rounded-lg">
              <Users className="text-blue-500 mb-4" />
              <h4 className="font-bold text-sm uppercase mb-2 tracking-tighter">
                Resurgence Theme
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed italic">
                "It is not about machines replacing minds, it is about minds
                empowered by machines."
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-[10px] tracking-[0.5em] text-gray-600 uppercase font-black">
          // Connection Secured // Resurgence V2.0 // Breach@Trix
        </p>
      </footer>
    </div>
  );
}
