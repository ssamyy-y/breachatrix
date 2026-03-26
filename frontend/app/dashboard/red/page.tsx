"use client";

import AnnouncementBanner from "@/components/AnnouncementBanner";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type AttackLog = {
  id: string;
  attackerId: string;
  targetTeamId: string;
  type: string;
  success: boolean;
  createdAt: string;
};

type Target = {
  id: string;
  name: string;
  score: number;
};

type MyTeam = {
  id: string;
  name: string;
  role: string;
  score: number;
};

const ATTACK_TYPES = [
  {
    value: "SQL_INJECTION",
    label: "SQL Injection",
    icon: "💉",
    severity: "CRITICAL",
  },
  { value: "XSS", label: "Cross-Site Scripting", icon: "🪝", severity: "HIGH" },
  {
    value: "AUTH_BYPASS",
    label: "Auth Bypass",
    icon: "🔓",
    severity: "CRITICAL",
  },
  {
    value: "MISCONFIG",
    label: "Misconfiguration Exploit",
    icon: "⚙️",
    severity: "MEDIUM",
  },
];

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#ff2244",
  HIGH: "#ff8800",
  MEDIUM: "#ffcc00",
};

function getSeverity(type: string) {
  const found = ATTACK_TYPES.find((a) => a.value === type);
  return found?.severity ?? "MEDIUM";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { hour12: false });
}

function GlitchText({ text }: { text: string }) {
  return (
    <span className="glitch" data-text={text}>
      {text}
    </span>
  );
}

export default function RedTeamDashboard() {
  const [logs, setLogs] = useState<AttackLog[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [myTeam, setMyTeam] = useState<MyTeam | null>(null);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [attackType, setAttackType] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [scanning, setScanning] = useState(false);

  async function fetchAll() {
    try {
      const [lRes, tRes, mRes] = await Promise.all([
        fetch("http://localhost:5000/attack/history", {
          credentials: "include",
        }),
        fetch("http://localhost:5000/attack/targets", {
          credentials: "include",
        }),
        fetch("http://localhost:5000/team/me", {
          credentials: "include",
        }),
      ]);
      const [lData, tData, mData] = await Promise.all([
        lRes.json(),
        tRes.json(),
        mRes.json(),
      ]);
      setLogs(Array.isArray(lData) ? lData : []);
      setTargets(Array.isArray(tData) ? tData : []);
      if (mData && mData.id) setMyTeam(mData);
    } catch {
      setLogs([]);
    }
  }

  async function fetchLogs() {
    try {
      const [lRes, mRes] = await Promise.all([
        fetch("http://localhost:5000/attack/history", {
          credentials: "include",
        }),
        fetch("http://localhost:5000/team/me", {
          credentials: "include",
        }),
      ]);
      const [lData, mData] = await Promise.all([lRes.json(), mRes.json()]);
      setLogs(Array.isArray(lData) ? lData : []);
      if (mData && mData.id) setMyTeam(mData);
    } catch {
      setLogs([]);
    }
  }

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    if (!selectedTarget || !attackType) {
      setSubmitMsg({ ok: false, text: "Select a target and attack vector." });
      return;
    }
    setLoading(true);
    setScanning(true);
    setSubmitMsg(null);

    // Fake scanning delay for drama
    await new Promise((r) => setTimeout(r, 1400));
    setScanning(false);

    try {
      const res = await fetch("http://localhost:5000/attack/submit", {
        method: "POST",
        credentials: "include", // 🔥 REQUIRED
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetTeamId: selectedTarget,
          type: attackType,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitMsg({
          ok: true,
          text: `✔ BREACH LOGGED — ${data.attack?.type}`,
        });
        fetchLogs();
      } else {
        setSubmitMsg({ ok: false, text: data.error ?? "Attack failed." });
      }
    } catch {
      setSubmitMsg({ ok: false, text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  const successCount = logs.filter((l) => l.success).length;
  const criticalCount = logs.filter(
    (l) => getSeverity(l.type) === "CRITICAL",
  ).length;

  return (
    <>
      <AnnouncementBanner />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #060608; }

        .rtd {
          min-height: 100vh;
          background: #060608;
          color: #e8e8e0;
          font-family: 'Rajdhani', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* scanlines overlay */
        .rtd::before {
          content: '';
          pointer-events: none;
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.18) 2px,
            rgba(0,0,0,0.18) 4px
          );
          z-index: 100;
        }

        /* red corner accent */
        .rtd::after {
          content: '';
          pointer-events: none;
          position: fixed;
          top: 0; left: 0;
          width: 320px; height: 320px;
          background: radial-gradient(ellipse at top left, rgba(220,20,40,0.18) 0%, transparent 70%);
          z-index: 0;
        }

        /* ——— TOP BAR ——— */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 36px;
          border-bottom: 1px solid rgba(220,20,40,0.3);
          background: rgba(10,6,8,0.95);
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(8px);
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .badge-red {
          background: #dc1428;
          color: #fff;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          letter-spacing: 2px;
          padding: 4px 10px;
          clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
        }

        .topbar-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 4px;
          color: #fff;
          text-transform: uppercase;
        }

        .topbar-title span { color: #dc1428; }

        .topbar-mono {
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px;
          color: #555;
          letter-spacing: 1px;
        }

        /* ——— GRID LAYOUT ——— */
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          grid-template-rows: auto 1fr;
          gap: 0;
          min-height: calc(100vh - 65px);
        }

        /* ——— STATS ROW ——— */
        .stats-row {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          border-bottom: 1px solid rgba(220,20,40,0.15);
        }

        .stat-cell {
          padding: 22px 28px;
          border-right: 1px solid rgba(220,20,40,0.1);
          position: relative;
          overflow: hidden;
        }

        .stat-cell:last-child { border-right: none; }

        .stat-cell::before {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 100%; height: 2px;
          background: linear-gradient(90deg, #dc1428, transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .stat-cell:hover::before { opacity: 1; }

        .stat-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          color: #555;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .stat-value {
          font-size: 38px;
          font-weight: 700;
          line-height: 1;
          color: #fff;
        }

        .stat-value.red { color: #dc1428; }
        .stat-value.amber { color: #ff8800; }

        .stat-sub {
          font-size: 12px;
          color: #444;
          margin-top: 4px;
          font-family: 'Share Tech Mono', monospace;
        }

        /* ——— ATTACK LOG PANEL ——— */
        .log-panel {
          padding: 28px 32px;
          border-right: 1px solid rgba(220,20,40,0.15);
          overflow-y: auto;
          max-height: calc(100vh - 65px - 97px);
        }

        .panel-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .panel-heading h2 {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #888;
        }

        .panel-heading-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(220,20,40,0.4), transparent);
        }

        /* log entries */
        .log-entry {
          display: grid;
          grid-template-columns: 90px 1fr auto auto;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          margin-bottom: 6px;
          background: rgba(255,255,255,0.022);
          border-left: 2px solid transparent;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .log-entry:hover {
          background: rgba(220,20,40,0.07);
          border-left-color: #dc1428;
        }

        .log-time {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #3a3a3a;
          line-height: 1.4;
        }

        .log-type {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: #ccc;
        }

        .log-icon {
          font-size: 11px;
          margin-right: 6px;
        }

        .sev-pill {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 1.5px;
          padding: 3px 8px;
          clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%);
          font-weight: 700;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22cc66;
          box-shadow: 0 0 6px #22cc66;
        }

        .status-dot.fail {
          background: #555;
          box-shadow: none;
        }

        /* empty state */
        .empty-log {
          text-align: center;
          padding: 60px 20px;
          font-family: 'Share Tech Mono', monospace;
          color: #333;
          font-size: 13px;
          line-height: 2;
        }

        /* ——— SIDE PANEL ——— */
        .side-panel {
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* attack form */
        .form-card {
          border: 1px solid rgba(220,20,40,0.2);
          background: rgba(220,20,40,0.03);
          padding: 20px;
          position: relative;
        }

        .form-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #dc1428, transparent);
        }

        .form-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          color: #555;
          text-transform: uppercase;
          margin-bottom: 8px;
          display: block;
        }

        .form-select {
          width: 100%;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(220,20,40,0.25);
          color: #ccc;
          padding: 9px 12px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px;
          margin-bottom: 14px;
          outline: none;
          appearance: none;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .form-select:focus {
          border-color: #dc1428;
        }

        /* attack type buttons */
        .type-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 14px;
        }

        .type-btn {
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 10px 8px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .type-btn:hover {
          border-color: rgba(220,20,40,0.4);
          background: rgba(220,20,40,0.06);
        }

        .type-btn.selected {
          border-color: #dc1428;
          background: rgba(220,20,40,0.12);
        }

        .type-btn-icon { font-size: 16px; }

        .type-btn-label {
          font-size: 11px;
          font-weight: 600;
          color: #bbb;
          letter-spacing: 0.5px;
        }

        .type-btn-sev {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 1px;
        }

        /* launch button */
        .launch-btn {
          width: 100%;
          padding: 13px;
          background: #dc1428;
          border: none;
          color: #fff;
          font-family: 'Rajdhani', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          cursor: pointer;
          clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .launch-btn:disabled {
          background: #2a0a0d;
          color: #5a2025;
          cursor: not-allowed;
          clip-path: none;
        }

        .launch-btn:not(:disabled):hover {
          background: #ff1c32;
          box-shadow: 0 0 20px rgba(220,20,40,0.5);
        }

        .scan-bar {
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          animation: scan 0.7s linear infinite;
        }

        @keyframes scan {
          to { left: 100%; }
        }

        /* feedback msg */
        .msg {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          padding: 8px 12px;
          margin-top: 10px;
          letter-spacing: 0.5px;
        }
        .msg.ok { color: #22cc66; background: rgba(34,204,102,0.06); border-left: 2px solid #22cc66; }
        .msg.err { color: #ff2244; background: rgba(255,34,68,0.06); border-left: 2px solid #ff2244; }

        /* targets list */
        .targets-card {
          border: 1px solid rgba(255,255,255,0.06);
          padding: 20px;
        }

        .target-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        .target-row:last-child { border-bottom: none; }

        .target-name {
          font-size: 13px;
          font-weight: 600;
          color: #bbb;
        }

        .target-score {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #555;
        }

        /* glitch */
        .glitch {
          position: relative;
          display: inline-block;
        }

        .glitch::before,
        .glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
        }

        .glitch::before {
          color: #dc1428;
          animation: glitch1 3s infinite linear;
          clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
          opacity: 0.7;
        }

        .glitch::after {
          color: #00ffe0;
          animation: glitch2 3s infinite linear;
          clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
          opacity: 0.5;
        }

        @keyframes glitch1 {
          0%, 90%, 100% { transform: translate(0); opacity: 0; }
          92% { transform: translate(-2px, 1px); opacity: 0.7; }
          94% { transform: translate(2px, -1px); opacity: 0.7; }
          96% { transform: translate(0); opacity: 0; }
        }

        @keyframes glitch2 {
          0%, 90%, 100% { transform: translate(0); opacity: 0; }
          93% { transform: translate(2px, 1px); opacity: 0.5; }
          95% { transform: translate(-2px, -1px); opacity: 0.5; }
          97% { transform: translate(0); opacity: 0; }
        }

        /* pulse dot */
        .live-dot {
          display: inline-block;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #dc1428;
          box-shadow: 0 0 0 0 rgba(220,20,40,0.6);
          animation: pulse 1.6s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(220,20,40,0.6); }
          70% { box-shadow: 0 0 0 8px rgba(220,20,40,0); }
          100% { box-shadow: 0 0 0 0 rgba(220,20,40,0); }
        }

        /* score badge */
        .team-score-badge {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding: 4px 12px;
          border: 1px solid rgba(220,20,40,0.3);
          background: rgba(220,20,40,0.06);
        }

        .score-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 2px;
          color: #554;
        }

        .score-value {
          font-size: 20px;
          font-weight: 700;
          color: #dc1428;
          line-height: 1.1;
        }

        .score-name {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          color: #664;
          letter-spacing: 1px;
        }

        /* scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(220,20,40,0.3); border-radius: 2px; }

        @media (max-width: 900px) {
          .main-grid { grid-template-columns: 1fr; }
          .stats-row { grid-template-columns: repeat(2, 1fr); }
          .log-panel { border-right: none; max-height: none; }
        }
      `}</style>

      <div className="rtd">
        {/* ——— TOP BAR ——— */}
        <header className="topbar">
          <div className="topbar-left">
            <span className="badge-red">🔴 RED TEAM</span>
            <h1 className="topbar-title">
              BREACH<span>@</span>TRIX
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {myTeam && (
              <div className="team-score-badge">
                <span className="score-label">TEAM SCORE</span>
                <span className="score-value">{myTeam.score}</span>
                <span className="score-name">{myTeam.name}</span>
              </div>
            )}
            <span className="live-dot" />
            <span className="topbar-mono">LIVE SESSION</span>
          </div>
        </header>

        <div className="main-grid">
          {/* ——— STATS ROW ——— */}
          <div className="stats-row">
            <div className="stat-cell">
              <div className="stat-label">Total Attacks</div>
              <div className="stat-value red">{logs.length}</div>
              <div className="stat-sub">logged breaches</div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">Successful</div>
              <div className="stat-value">{successCount}</div>
              <div className="stat-sub">confirmed exploits</div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">Critical Hits</div>
              <div className="stat-value amber">{criticalCount}</div>
              <div className="stat-sub">high-severity</div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">Targets Online</div>
              <div className="stat-value">{targets.length}</div>
              <div className="stat-sub">available teams</div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">Team Score</div>
              <div className="stat-value red">{myTeam?.score ?? 0}</div>
              <div className="stat-sub">total points earned</div>
            </div>
          </div>

          {/* ——— ATTACK LOG ——— */}
          <section className="log-panel">
            <div className="panel-heading">
              <h2>Attack Log</h2>
              <div className="panel-heading-line" />
            </div>

            {logs.length === 0 ? (
              <div className="empty-log">
                &gt; NO ATTACK RECORDS FOUND
                <br />
                &gt; LAUNCH YOUR FIRST EXPLOIT
                <br />
                &gt; _
              </div>
            ) : (
              logs.map((log) => {
                const sev = getSeverity(log.type);
                const atk = ATTACK_TYPES.find((a) => a.value === log.type);
                return (
                  <div className="log-entry" key={log.id}>
                    <div className="log-time">
                      {formatTime(log.createdAt).replace(", ", "\n")}
                    </div>
                    <div className="log-type">
                      <span className="log-icon">{atk?.icon ?? "⚡"}</span>
                      {atk?.label ?? log.type}
                    </div>
                    <span
                      className="sev-pill"
                      style={{
                        background: SEVERITY_COLORS[sev] + "22",
                        color: SEVERITY_COLORS[sev],
                      }}
                    >
                      {sev}
                    </span>
                    <div
                      className={`status-dot ${log.success ? "" : "fail"}`}
                    />
                  </div>
                );
              })
            )}
          </section>

          {/* ——— SIDE PANEL ——— */}
          <aside className="side-panel">
            {/* launch attack */}
            <div className="form-card">
              <div className="panel-heading" style={{ marginBottom: 16 }}>
                <h2>Launch Attack</h2>
                <div className="panel-heading-line" />
              </div>

              <label className="form-label">Select Target</label>
              <select
                className="form-select"
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
              >
                <option value="">-- choose target --</option>
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <label className="form-label">Attack Vector</label>
              <div className="type-grid">
                {ATTACK_TYPES.map((a) => (
                  <button
                    key={a.value}
                    className={`type-btn ${attackType === a.value ? "selected" : ""}`}
                    onClick={() => setAttackType(a.value)}
                  >
                    <span className="type-btn-icon">{a.icon}</span>
                    <span className="type-btn-label">{a.label}</span>
                    <span
                      className="type-btn-sev"
                      style={{ color: SEVERITY_COLORS[a.severity] }}
                    >
                      {a.severity}
                    </span>
                  </button>
                ))}
              </div>

              <button
                className="launch-btn"
                onClick={handleSubmit}
                disabled={loading || !selectedTarget || !attackType}
              >
                {scanning && <span className="scan-bar" />}
                {scanning
                  ? "SCANNING TARGET..."
                  : loading
                    ? "DEPLOYING..."
                    : "⚡ LAUNCH ATTACK"}
              </button>

              {submitMsg && (
                <div className={`msg ${submitMsg.ok ? "ok" : "err"}`}>
                  {submitMsg.text}
                </div>
              )}
            </div>

            {/* targets */}
            <div className="targets-card">
              <div className="panel-heading" style={{ marginBottom: 12 }}>
                <h2>Enemy Teams</h2>
                <div className="panel-heading-line" />
              </div>
              {targets.length === 0 ? (
                <p
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 11,
                    color: "#333",
                  }}
                >
                  &gt; No targets detected
                </p>
              ) : (
                targets.map((t) => (
                  <div className="target-row" key={t.id}>
                    <span className="target-name">{t.name}</span>
                    <span className="target-score">{t.score} pts</span>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
