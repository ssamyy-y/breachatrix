"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type DefenseLog = {
  id: string;
  teamId: string;
  type: string;
  success: boolean;
  createdAt: string;
};

type IncomingAttack = {
  id: string;
  attackerId: string;
  targetTeamId: string;
  type: string;
  success: boolean;
  createdAt: string;
};

type MyTeam = {
  id: string;
  name: string;
  role: string;
  score: number;
};

const VULN_TYPES = [
  { value: "SQL_INJECTION", label: "SQL Injection", icon: "💉", color: "#0af" },
  { value: "XSS", label: "Cross-Site Scripting", icon: "🪝", color: "#00e5b0" },
  { value: "AUTH_BYPASS", label: "Auth Bypass", icon: "🔓", color: "#4488ff" },
  {
    value: "MISCONFIG",
    label: "Misconfiguration",
    icon: "⚙️",
    color: "#a78bfa",
  },
];

const ATTACK_SEVERITY: Record<string, string> = {
  SQL_INJECTION: "CRITICAL",
  AUTH_BYPASS: "CRITICAL",
  XSS: "HIGH",
  MISCONFIG: "MEDIUM",
};

const SEV_COLOR: Record<string, string> = {
  CRITICAL: "#ff2244",
  HIGH: "#ff8800",
  MEDIUM: "#ffcc00",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { hour12: false });
}

function getVuln(type: string) {
  return VULN_TYPES.find((v) => v.value === type);
}

export default function BlueTeamDashboard() {
  const [defenseLogs, setDefenseLogs] = useState<DefenseLog[]>([]);
  const [incomingAttacks, setIncomingAttacks] = useState<IncomingAttack[]>([]);
  const [myTeam, setMyTeam] = useState<MyTeam | null>(null);
  const [patchType, setPatchType] = useState("");
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function fetchAll() {
    try {
      const [dRes, aRes, tRes] = await Promise.all([
        fetch(`http://localhost:5000/defense/logs`, {
          credentials: "include",
        }),
        fetch(`http://localhost:5000/defense/attacks`, {
          credentials: "include",
        }),
        fetch(`http://localhost:5000/team/me`, {
          credentials: "include",
        }),
      ]);
      const [dData, aData, tData] = await Promise.all([
        dRes.json(),
        aRes.json(),
        tRes.json(),
      ]);
      setDefenseLogs(Array.isArray(dData) ? dData : []);
      setIncomingAttacks(Array.isArray(aData) ? aData : []);
      if (tData && tData.id) setMyTeam(tData);
    } catch {
      /* silent */
    }
  }

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 12000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePatch() {
    if (!patchType) {
      setMsg({ ok: false, text: "Select a vulnerability to patch." });
      return;
    }
    setLoading(true);
    setDeploying(true);
    setMsg(null);
    await new Promise((r) => setTimeout(r, 1200));
    setDeploying(false);
    try {
      const res = await fetch("http://localhost:5000/defense/patch", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json", // 🔥 REQUIRED
        },
        body: JSON.stringify({ type: patchType }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({
          ok: true,
          text: `✔ PATCH DEPLOYED — ${patchType.replace("_", " ")}`,
        });
        fetchAll();
      } else {
        setMsg({ ok: false, text: data.error ?? "Patch failed." });
      }
    } catch {
      setMsg({ ok: false, text: "Network error." });
    } finally {
      setLoading(false);
    }
  }

  const patchedCount = defenseLogs.filter((d) => d.success).length;
  const criticalIncoming = incomingAttacks.filter(
    (a) => ATTACK_SEVERITY[a.type] === "CRITICAL",
  ).length;
  const systemHealth = Math.max(
    0,
    100 - incomingAttacks.length * 8 + patchedCount * 5,
  );
  const healthClamped = Math.min(100, systemHealth);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Exo+2:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #04080f; }

        .btd {
          min-height: 100vh;
          background: #04080f;
          color: #d0dcea;
          font-family: 'Exo 2', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* grid overlay */
        .btd::before {
          content: '';
          pointer-events: none;
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(0,160,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,160,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          z-index: 0;
        }

        /* blue ambient */
        .btd::after {
          content: '';
          pointer-events: none;
          position: fixed;
          top: 0; right: 0;
          width: 400px; height: 400px;
          background: radial-gradient(ellipse at top right, rgba(0,120,255,0.12) 0%, transparent 70%);
          z-index: 0;
        }

        /* ——— TOPBAR ——— */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 36px;
          border-bottom: 1px solid rgba(0,160,255,0.2);
          background: rgba(4,8,15,0.97);
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(10px);
        }

        .topbar-left { display: flex; align-items: center; gap: 14px; }

        .badge-blue {
          background: #0066cc;
          color: #fff;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          letter-spacing: 2px;
          padding: 4px 10px;
          clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
        }

        .topbar-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 4px;
          color: #fff;
          text-transform: uppercase;
        }
        .topbar-title span { color: #00aaff; }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .health-bar-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .team-name-badge {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding: 4px 12px;
          border: 1px solid rgba(0,160,255,0.25);
          background: rgba(0,100,200,0.08);
        }

        .team-name-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 2px;
          color: #334;
        }

        .team-name-value {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #00aaff;
        }

        .health-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          color: #445;
        }

        .health-track {
          width: 120px;
          height: 6px;
          background: rgba(255,255,255,0.06);
          border-radius: 3px;
          overflow: hidden;
        }

        .health-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.8s ease;
        }

        .health-pct {
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px;
          min-width: 36px;
          text-align: right;
        }

        /* ——— LAYOUT ——— */
        .main-grid {
          display: grid;
          grid-template-columns: 1fr 370px;
          grid-template-rows: auto 1fr;
          min-height: calc(100vh - 61px);
          position: relative;
          z-index: 1;
        }

        /* ——— STATS ——— */
        .stats-row {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-bottom: 1px solid rgba(0,160,255,0.1);
        }

        .stat-cell {
          padding: 20px 26px;
          border-right: 1px solid rgba(0,160,255,0.08);
          position: relative;
        }
        .stat-cell:last-child { border-right: none; }

        .stat-cell::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 0; height: 2px;
          background: linear-gradient(90deg, #00aaff, transparent);
          transition: width 0.4s;
        }
        .stat-cell:hover::after { width: 100%; }

        .stat-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          color: #334;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .stat-value {
          font-size: 36px;
          font-weight: 800;
          line-height: 1;
          color: #fff;
        }
        .stat-value.blue { color: #00aaff; }
        .stat-value.red { color: #ff2244; }
        .stat-value.green { color: #22cc77; }

        .stat-sub {
          font-size: 11px;
          color: #334;
          margin-top: 4px;
          font-family: 'Share Tech Mono', monospace;
        }

        /* ——— MAIN LOG ——— */
        .log-panel {
          padding: 26px 30px;
          border-right: 1px solid rgba(0,160,255,0.1);
          overflow-y: auto;
          max-height: calc(100vh - 61px - 89px);
        }

        .panel-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }

        .panel-heading h2 {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: #446;
          white-space: nowrap;
        }

        .panel-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(0,160,255,0.3), transparent);
        }

        /* tabs */
        .tabs {
          display: flex;
          gap: 0;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(0,160,255,0.1);
        }

        .tab-btn {
          padding: 8px 18px;
          background: none;
          border: none;
          font-family: 'Exo 2', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #334;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          transition: all 0.2s;
        }

        .tab-btn:hover { color: #668; }
        .tab-btn.active {
          color: #00aaff;
          border-bottom-color: #00aaff;
        }

        /* log rows */
        .log-entry {
          display: grid;
          grid-template-columns: 90px 1fr auto auto;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          margin-bottom: 5px;
          background: rgba(255,255,255,0.018);
          border-left: 2px solid transparent;
          transition: all 0.2s;
        }

        .log-entry:hover {
          background: rgba(0,160,255,0.06);
          border-left-color: #00aaff;
        }

        .log-entry.incoming:hover {
          background: rgba(255,34,68,0.05);
          border-left-color: #ff2244;
        }

        .log-time {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          color: #334;
          line-height: 1.4;
        }

        .log-type {
          font-size: 13px;
          font-weight: 600;
          color: #bbc;
        }

        .type-icon { margin-right: 6px; font-size: 12px; }

        .sev-pill {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 1.5px;
          padding: 3px 8px;
          clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%);
          font-weight: 700;
        }

        .status-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #22cc77;
          box-shadow: 0 0 6px #22cc77;
        }
        .status-dot.threat {
          background: #ff2244;
          box-shadow: 0 0 6px #ff2244;
          animation: blink 1.2s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .empty-state {
          text-align: center;
          padding: 50px 20px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px;
          color: #223;
          line-height: 2.2;
        }

        /* ——— SIDE PANEL ——— */
        .side-panel {
          padding: 26px 22px;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .form-card {
          border: 1px solid rgba(0,160,255,0.18);
          background: rgba(0,100,200,0.04);
          padding: 20px;
          position: relative;
        }

        .form-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #00aaff, transparent);
        }

        .form-label {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          color: #334;
          text-transform: uppercase;
          margin-bottom: 10px;
          display: block;
        }

        /* patch type grid */
        .patch-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 14px;
        }

        .patch-btn {
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 10px 8px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .patch-btn:hover {
          border-color: rgba(0,160,255,0.4);
          background: rgba(0,160,255,0.07);
        }

        .patch-btn.selected {
          border-color: #00aaff;
          background: rgba(0,160,255,0.12);
        }

        .patch-btn-icon { font-size: 15px; }

        .patch-btn-label {
          font-size: 11px;
          font-weight: 600;
          color: #889;
          letter-spacing: 0.4px;
        }

        .patch-btn-color {
          font-family: 'Share Tech Mono', monospace;
          font-size: 9px;
          letter-spacing: 1px;
        }

        /* deploy button */
        .deploy-btn {
          width: 100%;
          padding: 13px;
          background: #0066cc;
          border: none;
          color: #fff;
          font-family: 'Exo 2', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 3px;
          text-transform: uppercase;
          cursor: pointer;
          clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .deploy-btn:disabled {
          background: #081830;
          color: #1a3050;
          cursor: not-allowed;
          clip-path: none;
        }

        .deploy-btn:not(:disabled):hover {
          background: #0088ff;
          box-shadow: 0 0 22px rgba(0,140,255,0.45);
        }

        .scan-bar {
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          animation: sweep 0.6s linear infinite;
        }
        @keyframes sweep { to { left: 100%; } }

        .msg {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          padding: 8px 12px;
          margin-top: 10px;
          letter-spacing: 0.4px;
        }
        .msg.ok  { color: #22cc77; background: rgba(34,204,119,0.06); border-left: 2px solid #22cc77; }
        .msg.err { color: #ff2244; background: rgba(255,34,68,0.06);  border-left: 2px solid #ff2244; }

        /* threat summary */
        .threat-card {
          border: 1px solid rgba(255,255,255,0.05);
          padding: 18px;
        }

        .threat-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .threat-row:last-child { border-bottom: none; }

        .threat-type {
          font-size: 12px;
          font-weight: 600;
          color: #889;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .threat-count {
          font-family: 'Share Tech Mono', monospace;
          font-size: 13px;
          color: #ff2244;
        }

        /* live indicator */
        .live-dot {
          display: inline-block;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #00aaff;
          box-shadow: 0 0 0 0 rgba(0,170,255,0.5);
          animation: pulse 1.8s infinite;
        }
        @keyframes pulse {
          0%   { box-shadow: 0 0 0 0 rgba(0,170,255,0.5); }
          70%  { box-shadow: 0 0 0 8px rgba(0,170,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,170,255,0); }
        }

        /* scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,160,255,0.25); border-radius: 2px; }

        @media (max-width: 900px) {
          .main-grid { grid-template-columns: 1fr; }
          .stats-row { grid-template-columns: repeat(2, 1fr); }
          .log-panel { border-right: none; max-height: none; }
        }
      `}</style>

      <div className="btd">
        {/* ——— TOP BAR ——— */}
        <header className="topbar">
          <div className="topbar-left">
            <span className="badge-blue">🔵 BLUE TEAM</span>
            <h1 className="topbar-title">
              BREACH<span>@</span>TRIX
            </h1>
          </div>
          <div className="topbar-right">
            {myTeam && (
              <div className="team-name-badge">
                <span className="team-name-label">TEAM</span>
                <span className="team-name-value">{myTeam.name}</span>
              </div>
            )}
            <div className="health-bar-wrap">
              <span className="health-label">SYS HEALTH</span>
              <div className="health-track">
                <div
                  className="health-fill"
                  style={{
                    width: `${healthClamped}%`,
                    background:
                      healthClamped > 60
                        ? "#22cc77"
                        : healthClamped > 30
                          ? "#ffaa00"
                          : "#ff2244",
                    boxShadow:
                      healthClamped > 60
                        ? "0 0 8px #22cc77"
                        : healthClamped > 30
                          ? "0 0 8px #ffaa00"
                          : "0 0 8px #ff2244",
                  }}
                />
              </div>
              <span
                className="health-pct"
                style={{
                  color:
                    healthClamped > 60
                      ? "#22cc77"
                      : healthClamped > 30
                        ? "#ffaa00"
                        : "#ff2244",
                }}
              >
                {healthClamped}%
              </span>
            </div>
            <span className="live-dot" />
          </div>
        </header>

        <div className="main-grid">
          {/* ——— STATS ——— */}
          <div className="stats-row">
            <div className="stat-cell">
              <div className="stat-label">Team Score</div>
              <div className="stat-value blue">{myTeam?.score ?? 0}</div>
              <div className="stat-sub">total points</div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">Patches Deployed</div>
              <div className="stat-value blue">{patchedCount}</div>
              <div className="stat-sub">vulnerabilities fixed</div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">Incoming Attacks</div>
              <div className="stat-value red">{incomingAttacks.length}</div>
              <div className="stat-sub">threats detected</div>
            </div>
            <div className="stat-cell">
              <div className="stat-label">Critical Threats</div>
              <div className="stat-value red">{criticalIncoming}</div>
              <div className="stat-sub">high-severity hits</div>
            </div>
          </div>

          {/* ——— LOG PANEL ——— */}
          <section className="log-panel">
            <Tabs incomingAttacks={incomingAttacks} defenseLogs={defenseLogs} />
          </section>

          {/* ——— SIDE PANEL ——— */}
          <aside className="side-panel">
            {/* patch form */}
            <div className="form-card">
              <div className="panel-heading" style={{ marginBottom: 14 }}>
                <h2>Deploy Patch</h2>
                <div className="panel-line" />
              </div>

              <label className="form-label">Select Vulnerability</label>
              <div className="patch-grid">
                {VULN_TYPES.map((v) => (
                  <button
                    key={v.value}
                    className={`patch-btn ${patchType === v.value ? "selected" : ""}`}
                    onClick={() => setPatchType(v.value)}
                  >
                    <span className="patch-btn-icon">{v.icon}</span>
                    <span className="patch-btn-label">{v.label}</span>
                    <span
                      className="patch-btn-color"
                      style={{ color: v.color }}
                    >
                      PATCH
                    </span>
                  </button>
                ))}
              </div>

              <button
                className="deploy-btn"
                onClick={handlePatch}
                disabled={loading || !patchType}
              >
                {deploying && <span className="scan-bar" />}
                {deploying
                  ? "ANALYZING PATCH..."
                  : loading
                    ? "DEPLOYING..."
                    : "🛡 DEPLOY PATCH"}
              </button>

              {msg && (
                <div className={`msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>
              )}
            </div>

            {/* threat breakdown */}
            <div className="threat-card">
              <div className="panel-heading" style={{ marginBottom: 12 }}>
                <h2>Threat Breakdown</h2>
                <div className="panel-line" />
              </div>
              {VULN_TYPES.map((v) => {
                const count = incomingAttacks.filter(
                  (a) => a.type === v.value,
                ).length;
                return (
                  <div className="threat-row" key={v.value}>
                    <span className="threat-type">
                      {v.icon} {v.label}
                    </span>
                    <span className="threat-count">{count}x</span>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

/* ——— TABS COMPONENT ——— */
function Tabs({
  incomingAttacks,
  defenseLogs,
}: {
  incomingAttacks: IncomingAttack[];
  defenseLogs: DefenseLog[];
}) {
  const [tab, setTab] = useState<"incoming" | "defense">("incoming");

  return (
    <>
      <div className="tabs">
        <button
          className={`tab-btn ${tab === "incoming" ? "active" : ""}`}
          onClick={() => setTab("incoming")}
        >
          Incoming Attacks
          {incomingAttacks.length > 0 && (
            <span
              style={{
                marginLeft: 6,
                background: "#ff2244",
                color: "#fff",
                fontSize: 9,
                padding: "1px 5px",
                borderRadius: 2,
                fontFamily: "'Share Tech Mono', monospace",
              }}
            >
              {incomingAttacks.length}
            </span>
          )}
        </button>
        <button
          className={`tab-btn ${tab === "defense" ? "active" : ""}`}
          onClick={() => setTab("defense")}
        >
          Defense Logs
          {defenseLogs.length > 0 && (
            <span
              style={{
                marginLeft: 6,
                background: "#22cc77",
                color: "#fff",
                fontSize: 9,
                padding: "1px 5px",
                borderRadius: 2,
                fontFamily: "'Share Tech Mono', monospace",
              }}
            >
              {defenseLogs.length}
            </span>
          )}
        </button>
      </div>

      {tab === "incoming" ? (
        incomingAttacks.length === 0 ? (
          <div className="empty-state">
            &gt; NO INCOMING THREATS DETECTED
            <br />
            &gt; SYSTEM SECURE
            <br />
            &gt; _
          </div>
        ) : (
          incomingAttacks.map((atk) => {
            const v = getVuln(atk.type);
            const sev = ATTACK_SEVERITY[atk.type] ?? "MEDIUM";
            return (
              <div className="log-entry incoming" key={atk.id}>
                <div className="log-time">
                  {formatTime(atk.createdAt).replace(", ", "\n")}
                </div>
                <div className="log-type">
                  <span className="type-icon">{v?.icon ?? "⚡"}</span>
                  {v?.label ?? atk.type}
                </div>
                <span
                  className="sev-pill"
                  style={{
                    background: SEV_COLOR[sev] + "22",
                    color: SEV_COLOR[sev],
                  }}
                >
                  {sev}
                </span>
                <div className={`status-dot ${atk.success ? "threat" : ""}`} />
              </div>
            );
          })
        )
      ) : defenseLogs.length === 0 ? (
        <div className="empty-state">
          &gt; NO PATCHES DEPLOYED YET
          <br />
          &gt; DEPLOY YOUR FIRST FIX
          <br />
          &gt; _
        </div>
      ) : (
        defenseLogs.map((log) => {
          const v = getVuln(log.type);
          return (
            <div className="log-entry" key={log.id}>
              <div className="log-time">
                {formatTime(log.createdAt).replace(", ", "\n")}
              </div>
              <div className="log-type">
                <span className="type-icon">{v?.icon ?? "🛡"}</span>
                {v?.label ?? log.type}
              </div>
              <span
                className="sev-pill"
                style={{
                  background: "rgba(34,204,119,0.12)",
                  color: "#22cc77",
                }}
              >
                PATCHED
              </span>
              <div className="status-dot" />
            </div>
          );
        })
      )}
    </>
  );
}
