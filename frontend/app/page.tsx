"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const Scene3D = dynamic(() => import("@/components/Scene"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-[#030305] flex items-center justify-center z-[100]">
      <span className="text-red-600 font-mono animate-pulse text-sm tracking-widest">
        INITIALIZING_BREACH_SEQUENCE...
      </span>
    </div>
  ),
});

const RULES = [
  { id: "01", text: "1 team of 4 students per entry" },
  { id: "02", text: "Eligibility: Classes IX – XII" },
  { id: "03", text: "No pre-installed exploits or external toolkits" },
  { id: "04", text: "All attacks must stay within the sandboxed environment" },
  { id: "05", text: "Judges' decisions on scoring are final" },
];

const RED_ATTACKS = [
  "SQL Injection",
  "XSS (Cross-Site Scripting)",
  "Authentication Bypass",
  "Misconfiguration Exploits",
];

const BLUE_DEFENSES = [
  "Real-time Attack Analysis",
  "Vulnerability Patching",
  "Secure Code Hardening",
  "Damage Minimisation",
];

function GlitchText({ text }: { text: string }) {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className={`relative inline-block ${glitch ? "glitch" : ""}`}>
      {text}
      <style>{`
        .glitch {
          animation: glitch-clip 0.15s steps(1) forwards;
        }
        @keyframes glitch-clip {
          0%   { clip-path: inset(40% 0 50% 0); transform: translate(-4px, 0); color: #00ffff; }
          25%  { clip-path: inset(10% 0 80% 0); transform: translate(4px, 0); color: #ff0044; }
          50%  { clip-path: inset(70% 0 10% 0); transform: translate(-2px, 0); color: #ffff00; }
          75%  { clip-path: inset(30% 0 60% 0); transform: translate(2px, 0); color: #ff0044; }
          100% { clip-path: none; transform: none; color: inherit; }
        }
      `}</style>
    </span>
  );
}

function ScanLine() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[200]"
      style={{
        background:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
      }}
    />
  );
}

function TerminalBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm font-mono text-xs tracking-widest border"
      style={{
        color,
        borderColor: color,
        background: `${color}11`,
        boxShadow: `0 0 10px ${color}33`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function useScrollReveal() {
  useEffect(() => {
    const run = () => {
      const els = document.querySelectorAll(
        ".reveal, .reveal-left, .reveal-right",
      );
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("revealed");
              observer.unobserve(e.target);
            }
          });
        },
        { threshold: 0.1 },
      );
      els.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    };
    // small delay so DOM is fully painted
    const t = setTimeout(run, 100);
    return () => clearTimeout(t);
  }, []);
}

export default function Page() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useScrollReveal();

  return (
    <>
      {/* @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@300;400;500;600;700&family=Orbitron:wght@400;700;900&display=swap'); */}
      <style>{`

        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --red: #cc2200;
          --red-dim: #7a1500;
          --blue: #1a6eff;
          --blue-dim: #0d44bb;
          --bg: #060606;
          --surface: #0c0c0c;
          --border: #1c1c1c;
          --text: #e8e8e8;
          --dim: #5a5a5a;
        }
        html, body { background: var(--bg); overflow-x: hidden; }
        body { font-family: 'Rajdhani', sans-serif; color: var(--text); }
        .mono { font-family: 'Share Tech Mono', monospace; }
        .orbitron { font-family: 'Orbitron', monospace; }

        .red-glow  { text-shadow: 0 0 6px rgba(200,30,0,0.45); }
        .blue-glow { text-shadow: 0 0 6px rgba(26,110,255,0.45); }

        .card {
          background: rgba(10, 10, 10, 0.82);
          border: 1px solid var(--border);
          backdrop-filter: blur(14px);
        }
        .red-card {
          border-color: rgba(200, 30, 0, 0.28);
          box-shadow: inset 0 0 40px rgba(200,30,0,0.04), 0 0 24px rgba(200,30,0,0.07);
        }
        .blue-card {
          border-color: rgba(26, 110, 255, 0.28);
          box-shadow: inset 0 0 40px rgba(26,110,255,0.04), 0 0 24px rgba(26,110,255,0.07);
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--red), transparent);
        }
        .divider-blue {
          background: linear-gradient(90deg, transparent, var(--blue), transparent);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          92% { opacity: 1; }
          93% { opacity: 0.4; }
          94% { opacity: 1; }
          96% { opacity: 0.6; }
          97% { opacity: 1; }
        }
        .reveal {
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
        }
        .reveal.revealed {
          opacity: 1;
          transform: none;
        }
        .reveal-left {
          opacity: 0;
          transform: translateX(-32px);
          transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
        }
        .reveal-left.revealed { opacity: 1; transform: none; }
        .reveal-right {
          opacity: 0;
          transform: translateX(32px);
          transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
        }
        .reveal-right.revealed { opacity: 1; transform: none; }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.32s; }
        .reveal-delay-4 { transition-delay: 0.44s; }
        .flicker { animation: flicker 5s infinite; }

        .rule-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .rule-item:last-child { border-bottom: none; }

        .hex-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 40px;
          font-family: 'Orbitron', monospace;
          font-size: 13px;
          letter-spacing: 0.15em;
          font-weight: 700;
          clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          border: none;
        }
        .hex-btn-red {
          background: linear-gradient(135deg, #bb2200, #881500);
          color: #fff;
          box-shadow: 0 0 20px rgba(180,34,0,0.3);
        }
        .hex-btn-red:hover {
          box-shadow: 0 0 35px rgba(180,34,0,0.5);
          transform: translateY(-2px);
        }
        .hex-btn-outline {
          background: transparent;
          color: var(--text);
          outline: 1px solid rgba(255,255,255,0.2);
          clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
        }
        .hex-btn-outline:hover {
          background: rgba(255,255,255,0.05);
          transform: translateY(-2px);
        }

        .corner-tl, .corner-tr, .corner-bl, .corner-br {
          position: absolute;
          width: 14px; height: 14px;
        }
        .corner-tl { top: 0; left: 0; border-top: 1px solid; border-left: 1px solid; }
        .corner-tr { top: 0; right: 0; border-top: 1px solid; border-right: 1px solid; }
        .corner-bl { bottom: 0; left: 0; border-bottom: 1px solid; border-left: 1px solid; }
        .corner-br { bottom: 0; right: 0; border-bottom: 1px solid; border-right: 1px solid; }

        .tag-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 2px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.05em;
          transition: all 0.2s;
        }
        .tag-item:hover { transform: translateX(4px); }
        .tag-red  { background: rgba(200,30,0,0.07);   border-left: 2px solid var(--red);  color: #e8aa99; }
        .tag-blue { background: rgba(26,110,255,0.07); border-left: 2px solid var(--blue); color: #99b8ff; }

        .score-pill {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 24px;
          border-radius: 4px;
          gap: 4px;
        }

        :root {
  /* ... your other vars ... */
  --cyan: #00f2ff;
  --cyan-dim: #006666;
}

.cyber-btn-red {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding: 16px 48px;
  background: rgba(139, 0, 0, 0.15); /* Darker Red base */
  border: 1px solid rgba(255, 34, 0, 0.4);
  color: #fff;
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.25em;
  text-decoration: none;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(200, 30, 0, 0.1);
}

.cyber-btn-red:hover {
  background: rgba(200, 30, 0, 0.25);
  border-color: #ff2200;
  box-shadow: 0 0 30px rgba(255, 34, 0, 0.4), inset 0 0 20px rgba(255, 34, 0, 0.2);
  transform: translateY(-2px);
}

.cyber-btn-red::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 34, 0, 0.3), transparent);
  transition: left 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.cyber-btn-red:hover::before { left: 100%; }
      `}</style>

      <ScanLine />

      {/* 3D Background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 38%, #111111 0%, #060606 70%)",
          }}
        />
        {mounted && <Scene3D />}
      </div>

      {/* Content */}
      <main className="relative z-10 min-h-screen">
        {/* ── NAV ── */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,6,6,0.97) 0%, transparent 100%)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="orbitron text-sm font-bold tracking-widest text-white flicker">
            BREACH<span style={{ color: "var(--red)" }}>@</span>TRIX
          </div>
          <div className="flex items-center gap-5">
            <span
              className="mono text-xs flex items-center gap-2"
              style={{ color: "var(--dim)" }}
            >
              SYS::ONLINE
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "var(--red)" }}
              />
            </span>
            <a
              href="/login"
              className="hex-btn hex-btn-red"
              style={{ padding: "8px 24px", fontSize: "11px" }}
            >
              LOGIN
            </a>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <p
              className="mono text-xs tracking-[0.5em] mb-6 anim-1 flicker uppercase"
              style={{
                color: "#ffffff",
                textShadow: "0 0 10px rgba(255, 30, 0, 0.8)",
                opacity: 0.9,
              }}
            >
              Ordin@trix 26'
            </p>

            <h1
              className="orbitron font-black leading-none mb-4 anim-2"
              style={{
                fontSize: "clamp(3rem, 10vw, 8rem)",
                letterSpacing: "-0.02em",
              }}
            >
              <span style={{ color: "#c8c8c8" }}>BREACH</span>
              <span style={{ color: "#444" }}>@</span>
              <span style={{ color: "white" }}>TRIX</span>
            </h1>

            <div className="flex flex-wrap gap-3 justify-center mb-10 anim-4">
              <TerminalBadge label="🔴 RED TEAM :: ATTACK" color="#ff2200" />
              <TerminalBadge label="🔵 BLUE TEAM :: DEFEND" color="#0066ff" />
              <TerminalBadge label="CLASS IX – XII" color="#888899" />
              <TerminalBadge label="4 STUDENTS / TEAM" color="#888899" />
            </div>

            <div className="flex justify-center anim-5">
              <a href="/login" className="hex-btn hex-btn-red">
                <span>LOGIN</span>
                <span style={{ opacity: 0.7 }}>→</span>
              </a>
            </div>
          </div>

          {/* scroll hint */}
          <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 mono text-xs anim-6"
            style={{ color: "var(--dim)" }}
          >
            <div className="flex flex-col items-center gap-2">
              <span style={{ letterSpacing: "0.3em" }}>SCROLL</span>
              <div
                className="w-px h-8 animate-bounce"
                style={{ background: "var(--red)" }}
              />
            </div>
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section id="about" className="relative py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="divider mb-16" />
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="reveal reveal-left">
                <p
                  className="mono text-xs tracking-widest mb-3"
                  style={{ color: "var(--red)" }}
                >
                  // MISSION_BRIEF
                </p>
                <h2
                  className="orbitron font-bold mb-6"
                  style={{
                    fontSize: "clamp(1.8rem, 4vw, 3rem)",
                    lineHeight: 1.1,
                  }}
                >
                  High-Intensity
                  <br />
                  <span style={{ color: "var(--red)" }}>Cyber Warfare</span>
                </h2>
                <p
                  style={{
                    color: "var(--dim)",
                    lineHeight: 1.8,
                    fontSize: "1.05rem",
                  }}
                >
                  Breach@Trix pits teams against each other over a deliberately
                  vulnerable application. One side attacks, the other defends —
                  in real time. Every second counts. Every vulnerability
                  matters.
                </p>
              </div>
              <div className="card red-card rounded p-6 relative reveal reveal-right">
                <div
                  className="corner-tl"
                  style={{ borderColor: "var(--red)", opacity: 0.5 }}
                />
                <div
                  className="corner-tr"
                  style={{ borderColor: "var(--red)", opacity: 0.5 }}
                />
                <div
                  className="corner-bl"
                  style={{ borderColor: "var(--red)", opacity: 0.5 }}
                />
                <div
                  className="corner-br"
                  style={{ borderColor: "var(--red)", opacity: 0.5 }}
                />
                <p
                  className="mono text-xs mb-4"
                  style={{ color: "var(--red)" }}
                >
                  EVENT_PARAMS.json
                </p>
                <pre
                  className="mono text-xs leading-7"
                  style={{ color: "#aaa" }}
                >{`{
  "format":      "Red vs Blue",
  "team_size":   4,
  "eligibility": "Class IX – XII",
  "mode":        "Live Adversarial",
  "target":      "Vulnerable App/Website",
  "scoring":     "Real-time"
}`}</pre>
              </div>
            </div>
            <div className="divider mt-16" />
          </div>
        </section>

        {/* ── TEAMS ── */}
        <section id="teams" className="relative py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <p
              className="mono text-xs tracking-widest text-center mb-4 reveal"
              style={{ color: "var(--dim)" }}
            >
              // TEAM_ROLES
            </p>
            <h2
              className="orbitron font-bold text-center mb-16 reveal reveal-delay-1"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
            >
              Choose Your Side
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Red Team */}
              <div className="card red-card rounded-sm p-8 relative reveal reveal-left reveal-delay-2">
                <div
                  className="corner-tl"
                  style={{ borderColor: "var(--red)" }}
                />
                <div
                  className="corner-br"
                  style={{ borderColor: "var(--red)" }}
                />
                <div className="flex items-center gap-3 mb-6">
                  <span style={{ fontSize: "2rem" }}>🔴</span>
                  <div>
                    <div
                      className="orbitron font-bold text-xl red-glow"
                      style={{ color: "var(--red)" }}
                    >
                      RED TEAM
                    </div>
                    <div
                      className="mono text-xs"
                      style={{ color: "var(--dim)" }}
                    >
                      ATTACK & EXPLOIT
                    </div>
                  </div>
                </div>
                <p
                  className="mb-6 text-sm"
                  style={{ color: "var(--dim)", lineHeight: 1.7 }}
                >
                  Hunt for vulnerabilities, launch ethical attacks, and score
                  points based on successful exploits — speed and creativity
                  rewarded.
                </p>
                <div className="flex flex-col gap-2">
                  {RED_ATTACKS.map((a) => (
                    <div key={a} className="tag-item tag-red">
                      <span style={{ color: "var(--red)" }}>▸</span>
                      {a}
                    </div>
                  ))}
                </div>
              </div>

              {/* Blue Team */}
              <div className="card blue-card rounded-sm p-8 relative reveal reveal-right reveal-delay-2">
                <div
                  className="corner-tl"
                  style={{ borderColor: "var(--blue)" }}
                />
                <div
                  className="corner-br"
                  style={{ borderColor: "var(--blue)" }}
                />
                <div className="flex items-center gap-3 mb-6">
                  <span style={{ fontSize: "2rem" }}>🔵</span>
                  <div>
                    <div
                      className="orbitron font-bold text-xl blue-glow"
                      style={{ color: "var(--blue)" }}
                    >
                      BLUE TEAM
                    </div>
                    <div
                      className="mono text-xs"
                      style={{ color: "var(--dim)" }}
                    >
                      DEFEND & SECURE
                    </div>
                  </div>
                </div>
                <p
                  className="mb-6 text-sm"
                  style={{ color: "var(--dim)", lineHeight: 1.7 }}
                >
                  Monitor attacks in real time, patch vulnerabilities, and
                  harden the system — response time and stability are your
                  score.
                </p>
                <div className="flex flex-col gap-2">
                  {BLUE_DEFENSES.map((d) => (
                    <div key={d} className="tag-item tag-blue">
                      <span style={{ color: "var(--blue)" }}>▸</span>
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SCORING ── */}
        <section className="relative py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="divider divider-blue mb-16" />
            <p
              className="mono text-xs tracking-widest text-center mb-4 reveal"
              style={{ color: "var(--blue)" }}
            >
              // SCORING_MATRIX
            </p>
            <h2
              className="orbitron font-bold text-center mb-16 reveal reveal-delay-1"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
            >
              How Points Are Earned
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: "⚡",
                  title: "Red Team",
                  color: "var(--red)",
                  points: [
                    "Successful exploits",
                    "Severity of vulnerabilities",
                    "Speed of breach",
                  ],
                },
                {
                  icon: "🛡",
                  title: "Blue Team",
                  color: "var(--blue)",
                  points: [
                    "Patch effectiveness",
                    "Response time",
                    "System stability maintained",
                  ],
                },
                {
                  icon: "🎯",
                  title: "Bonus Points",
                  color: "#ffaa00",
                  points: [
                    "Creative techniques",
                    "Advanced exploits",
                    "Clean mitigation",
                  ],
                },
              ].map((cat, i) => (
                <div
                  key={cat.title}
                  className={`card rounded p-6 relative text-center reveal reveal-delay-${i + 1}`}
                  style={{
                    borderColor: `${cat.color}22`,
                    boxShadow: `0 0 20px ${cat.color}11`,
                  }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>
                    {cat.icon}
                  </div>
                  <div
                    className="orbitron font-bold mb-4 text-sm"
                    style={{ color: cat.color }}
                  >
                    {cat.title}
                  </div>
                  <ul className="flex flex-col gap-2">
                    {cat.points.map((p) => (
                      <li
                        key={p}
                        className="mono text-xs py-2 px-3 rounded"
                        style={{
                          background: `${cat.color}09`,
                          color: "#aaa",
                          borderLeft: `2px solid ${cat.color}44`,
                        }}
                      >
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="divider divider-blue mt-16" />
          </div>
        </section>

        {/* ── RULES ── */}
        <section className="relative py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <p
              className="mono text-xs tracking-widest text-center mb-4 reveal"
              style={{ color: "var(--dim)" }}
            >
              // RULES
            </p>
            <h2
              className="orbitron font-bold text-center mb-12 reveal reveal-delay-1"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)" }}
            >
              Rules of Engagement
            </h2>
            <div className="card rounded p-8 relative reveal reveal-delay-2">
              <div
                className="corner-tl"
                style={{ borderColor: "var(--red)", opacity: 0.4 }}
              />
              <div
                className="corner-tr"
                style={{ borderColor: "var(--red)", opacity: 0.4 }}
              />
              <div
                className="corner-bl"
                style={{ borderColor: "var(--blue)", opacity: 0.4 }}
              />
              <div
                className="corner-br"
                style={{ borderColor: "var(--blue)", opacity: 0.4 }}
              />
              {RULES.map((rule) => (
                <div key={rule.id} className="rule-item">
                  <span
                    className="mono text-xs flex-shrink-0 pt-0.5"
                    style={{ color: "var(--red)", minWidth: "28px" }}
                  >
                    {rule.id}
                  </span>
                  <span style={{ color: "#ccc", lineHeight: 1.6 }}>
                    {rule.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative py-32 px-6 text-center">
          <div
            className="divider mb-24"
            style={{
              background:
                "linear-gradient(90deg, transparent, #ff3333, transparent)",
            }}
          />
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-8 reveal">
              <div className="h-px w-12 bg-red-500/20" />
              <p
                className="mono text-xs tracking-widest m-0"
                style={{ color: "#ff3333" }}
              >
                // INITIATE_BREACH
              </p>
              <div className="h-px w-12 bg-red-500/20" />
            </div>

            <h2
              className="orbitron font-black mb-14 reveal reveal-delay-1 uppercase"
              style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)", lineHeight: 1 }}
            >
              <span style={{ color: "#e8e8e8" }}>Establish</span>
              <br />
              <span
                className="relative inline-block"
                style={{
                  color: "#ff3333",
                  textShadow: "0 0 30px rgba(255, 51, 51, 0.6)",
                }}
              >
                Connection.
              </span>
            </h2>

            <div className="reveal reveal-delay-2 flex justify-center">
              <a href="/login" className="cyber-btn-red group">
                <span style={{ color: "#ff3333", opacity: 0.7 }}>[</span>
                <span className="text-white group-hover:text-red-100 transition-colors duration-300">
                  AUTHENTICATE
                </span>
                <span style={{ color: "#ff3333", opacity: 0.7 }}>]</span>

                {/* Decorative corner borders */}
                <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-600/50 group-hover:border-red-500 transition-colors"></span>
                <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-red-600/50 group-hover:border-red-500 transition-colors"></span>
              </a>
            </div>

            <div
              className="mt-12 mono text-xs reveal reveal-delay-3"
              style={{ color: "var(--dim)" }}
            >
              <span className="flicker">
                &gt; Overriding local security...{" "}
                <span className="animate-pulse" style={{ color: "#ff3333" }}>
                  _
                </span>
              </span>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer
          className="relative py-8 px-8 flex items-center justify-between"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span
            className="orbitron text-xs font-bold"
            style={{ color: "var(--dim)" }}
          >
            BREACH<span style={{ color: "var(--red)" }}>@</span>TRIX
          </span>
          <span className="mono text-xs" style={{ color: "var(--dim)" }}>
            // HACK_ETHICALLY :: DEFEND_FIERCELY
          </span>
        </footer>
      </main>
    </>
  );
}
