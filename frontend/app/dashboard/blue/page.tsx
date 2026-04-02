"use client";

import { useEffect, useState } from "react";
import "@/styles/blueteam.css";
import AnnouncementBanner from "@/components/AnnouncementBanner";

const API = "http://localhost:5000";

function normalizeUrl(url: string | null) {
  if (!url) return null;
  // If it already starts with http:// or https://, leave it
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Otherwise, prepend https://
  return `https://${url}`;
}


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

type Opponent = {
  id: string;
  name: string;
  score: number;
  role: string;
};

type Matchup = {
  matchupId: string;
  roundLabel: string | null;
  targetUrl: string | null;
  repoUrl: string | null;
  myTeam: MyTeam;
  myRole: "RED" | "BLUE";
  opponent: Opponent;
};

const VULN_TYPES = [
  { value: "SQL_INJECTION", label: "SQL Injection",        icon: "💉", color: "#0af"    },
  { value: "XSS",           label: "Cross-Site Scripting", icon: "🪝", color: "#00e5b0" },
  { value: "AUTH_BYPASS",   label: "Auth Bypass",          icon: "🔓", color: "#4488ff" },
  { value: "MISCONFIG",     label: "Misconfiguration",     icon: "⚙️", color: "#a78bfa" },
];

const ATTACK_SEVERITY: Record<string, string> = {
  SQL_INJECTION: "CRITICAL",
  AUTH_BYPASS:   "CRITICAL",
  XSS:           "HIGH",
  MISCONFIG:     "MEDIUM",
};

const SEV_COLOR: Record<string, string> = {
  CRITICAL: "#ff2244",
  HIGH:     "#ff8800",
  MEDIUM:   "#ffcc00",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { hour12: false });
}

function getVuln(type: string) {
  return VULN_TYPES.find((v) => v.value === type);
}

export default function BlueTeamDashboard() {
  const [defenseLogs, setDefenseLogs]       = useState<DefenseLog[]>([]);
  const [incomingAttacks, setIncomingAttacks] = useState<IncomingAttack[]>([]);
  const [myTeam, setMyTeam]                 = useState<MyTeam | null>(null);
  const [matchup, setMatchup]               = useState<Matchup | null>(null);
  const [matchupError, setMatchupError]     = useState<string | null>(null);
  const [patchType, setPatchType]           = useState("");
  const [loading, setLoading]               = useState(false);
  const [deploying, setDeploying]           = useState(false);
  const [msg, setMsg]                       = useState<{ ok: boolean; text: string } | null>(null);

  async function fetchAll() {
    try {
      const [dRes, aRes, mRes] = await Promise.all([
        fetch(`${API}/defense/logs`,            { credentials: "include" }),
        fetch(`${API}/defense/attacks`,         { credentials: "include" }),
        fetch(`${API}/competition/my-matchup`,  { credentials: "include" }),
      ]);

      const [dData, aData] = await Promise.all([dRes.json(), aRes.json()]);
      setDefenseLogs(Array.isArray(dData) ? dData : []);
      setIncomingAttacks(Array.isArray(aData) ? aData : []);

      if (mRes.ok) {
        const mData: Matchup = await mRes.json();
        setMatchup(mData);
        setMyTeam(mData.myTeam);
        setMatchupError(null);
      } else {
        const err = await mRes.json();
        setMatchupError(err.error ?? "No active matchup found.");
        // Fall back to /team/me for score display
        const tRes = await fetch(`${API}/team/me`, { credentials: "include" });
        if (tRes.ok) setMyTeam(await tRes.json());
      }
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
      const res = await fetch(`${API}/defense/patch`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: patchType }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg({ ok: true, text: `✔ PATCH DEPLOYED — ${patchType.replace("_", " ")}` });
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

  const patchedCount      = defenseLogs.filter((d) => d.success).length;
  const criticalIncoming  = incomingAttacks.filter((a) => ATTACK_SEVERITY[a.type] === "CRITICAL").length;
  const systemHealth      = Math.min(100, Math.max(0, 100 - incomingAttacks.length * 8 + patchedCount * 5));

  return (
    <>
      <AnnouncementBanner />
      <div className="btd">

        {/* ——— TOP BAR ——— */}
        <header className="topbar">
          <div className="topbar-left">
            <span className="badge-blue">🔵 BLUE TEAM</span>
            <h1 className="topbar-title">BREACH<span>@</span>TRIX</h1>
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
                    width: `${systemHealth}%`,
                    background:    systemHealth > 60 ? "#22cc77" : systemHealth > 30 ? "#ffaa00" : "#ff2244",
                    boxShadow: systemHealth > 60 ? "0 0 8px #22cc77" : systemHealth > 30 ? "0 0 8px #ffaa00" : "0 0 8px #ff2244",
                  }}
                />
              </div>
              <span className="health-pct" style={{
                color: systemHealth > 60 ? "#22cc77" : systemHealth > 30 ? "#ffaa00" : "#ff2244",
              }}>
                {systemHealth}%
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
            <div className="stat-cell">
              <div className="stat-label">Opponent Score</div>
              <div className="stat-value red">{matchup?.opponent?.score ?? "—"}</div>
              <div className="stat-sub">{matchup?.opponent?.name ?? "awaiting matchup"}</div>
            </div>
          </div>

          {/* ——— LOG PANEL ——— */}
          <section className="log-panel">
            <Tabs incomingAttacks={incomingAttacks} defenseLogs={defenseLogs} />
          </section>

          {/* ——— SIDE PANEL ——— */}
          <aside className="side-panel">

            {/* ── MATCHUP INFO CARD ── */}
            <div className="form-card" style={{ marginBottom: 16 }}>
              <div className="panel-heading" style={{ marginBottom: 16 }}>
                <h2>Mission Briefing</h2>
                <div className="panel-line" />
              </div>

              {matchupError ? (
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 11,
                  color: "#333",
                  lineHeight: 1.8,
                }}>
                  &gt; {matchupError}
                  <br />&gt; Contact the admin.
                  <br />&gt; _
                </div>
              ) : !matchup ? (
                <div style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: 11,
                  color: "#333",
                }}>
                  &gt; LOADING...
                </div>
              ) : (
                <>
                  {matchup.roundLabel && (
                    <div style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 10,
                      color: "#22cc77",
                      letterSpacing: "0.15em",
                      marginBottom: 14,
                      textTransform: "uppercase",
                    }}>
                      ◈ {matchup.roundLabel}
                    </div>
                  )}

                  {/* Opponent */}
                  <div style={{ marginBottom: 18 }}>
                    <div className="form-label">Your Attacker</div>
                    <div style={{
                      background: "rgba(255,34,68,0.05)",
                      border: "1px solid rgba(255,34,68,0.15)",
                      borderRadius: 4,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 6,
                    }}>
                      <div>
                        <div style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 700,
                          fontSize: 15,
                          color: "#fff",
                          letterSpacing: "0.05em",
                        }}>
                          🔴 {matchup.opponent.name}
                        </div>
                        <div style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: 10,
                          color: "#555",
                          marginTop: 2,
                        }}>
                          RED TEAM · ATTACKING
                        </div>
                      </div>
                      <div style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: 18,
                        color: "#ff2244",
                        fontWeight: 700,
                      }}>
                        {matchup.opponent.score}
                        <span style={{ fontSize: 9, color: "#444", marginLeft: 3 }}>PTS</span>
                      </div>
                    </div>
                  </div>

                  {/* Target URL */}
                  <div style={{ marginBottom: 14 }}>
                    <div className="form-label">System Under Defense</div>
                    {matchup.targetUrl ? (
                      <a
                        href={normalizeUrl(matchup.targetUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          marginTop: 6,
                          padding: "10px 14px",
                          background: "rgba(34,204,119,0.08)",
                          border: "1px solid rgba(34,204,119,0.25)",
                          borderRadius: 4,
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: 12,
                          color: "#22cc77",
                          textDecoration: "none",
                          letterSpacing: "0.08em",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(34,204,119,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(34,204,119,0.08)";
                        }}
                      >
                        🛡 VIEW TARGET APP
                      </a>
                    ) : (
                      <div style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: 11,
                        color: "#333",
                        marginTop: 6,
                        padding: "10px 12px",
                        border: "1px dashed #1a1a1a",
                        borderRadius: 4,
                      }}>
                        &gt; URL PENDING...
                      </div>
                    )}
                  </div>

                  {/* Repo URL */}
                  <div>
                    <div className="form-label">Source Repo</div>
                    {matchup.repoUrl ? (
                      <a
                        href={normalizeUrl(matchup.repoUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          marginTop: 6,
                          padding: "10px 14px",
                          background: "rgba(68,136,255,0.08)",
                          border: "1px solid rgba(68,136,255,0.25)",
                          borderRadius: 4,
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: 12,
                          color: "#4488ff",
                          textDecoration: "none",
                          letterSpacing: "0.08em",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(68,136,255,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(68,136,255,0.08)";
                        }}
                      >
                        🔗 OPEN GITHUB REPO
                      </a>
                    ) : (
                      <div style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: 11,
                        color: "#333",
                        marginTop: 6,
                        padding: "10px 12px",
                        border: "1px dashed #1a1a1a",
                        borderRadius: 4,
                      }}>
                        &gt; REPO LINK PENDING...
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* ── PATCH FORM ── */}
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
                    <span className="patch-btn-color" style={{ color: v.color }}>PATCH</span>
                  </button>
                ))}
              </div>

              <button
                className="deploy-btn"
                onClick={handlePatch}
                disabled={loading || !patchType}
              >
                {deploying && <span className="scan-bar" />}
                {deploying ? "ANALYZING PATCH..." : loading ? "DEPLOYING..." : "🛡 DEPLOY PATCH"}
              </button>

              {msg && (
                <div className={`msg ${msg.ok ? "ok" : "err"}`}>{msg.text}</div>
              )}
            </div>

            {/* ── THREAT BREAKDOWN ── */}
            <div className="threat-card">
              <div className="panel-heading" style={{ marginBottom: 12 }}>
                <h2>Threat Breakdown</h2>
                <div className="panel-line" />
              </div>
              {VULN_TYPES.map((v) => {
                const count = incomingAttacks.filter((a) => a.type === v.value).length;
                return (
                  <div className="threat-row" key={v.value}>
                    <span className="threat-type">{v.icon} {v.label}</span>
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
            <span style={{
              marginLeft: 6, background: "#ff2244", color: "#fff",
              fontSize: 9, padding: "1px 5px", borderRadius: 2,
              fontFamily: "'Share Tech Mono', monospace",
            }}>
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
            <span style={{
              marginLeft: 6, background: "#22cc77", color: "#fff",
              fontSize: 9, padding: "1px 5px", borderRadius: 2,
              fontFamily: "'Share Tech Mono', monospace",
            }}>
              {defenseLogs.length}
            </span>
          )}
        </button>
      </div>

      {tab === "incoming" ? (
        incomingAttacks.length === 0 ? (
          <div className="empty-state">
            &gt; NO INCOMING THREATS DETECTED<br />
            &gt; SYSTEM SECURE<br />
            &gt; _
          </div>
        ) : (
          incomingAttacks.map((atk) => {
            const v   = getVuln(atk.type);
            const sev = ATTACK_SEVERITY[atk.type] ?? "MEDIUM";
            return (
              <div className="log-entry incoming" key={atk.id}>
                <div className="log-time">{formatTime(atk.createdAt).replace(", ", "\n")}</div>
                <div className="log-type">
                  <span className="type-icon">{v?.icon ?? "⚡"}</span>
                  {v?.label ?? atk.type}
                </div>
                <span className="sev-pill" style={{ background: SEV_COLOR[sev] + "22", color: SEV_COLOR[sev] }}>
                  {sev}
                </span>
                <div className={`status-dot ${atk.success ? "threat" : ""}`} />
              </div>
            );
          })
        )
      ) : defenseLogs.length === 0 ? (
        <div className="empty-state">
          &gt; NO PATCHES DEPLOYED YET<br />
          &gt; DEPLOY YOUR FIRST FIX<br />
          &gt; _
        </div>
      ) : (
        defenseLogs.map((log) => {
          const v = getVuln(log.type);
          return (
            <div className="log-entry" key={log.id}>
              <div className="log-time">{formatTime(log.createdAt).replace(", ", "\n")}</div>
              <div className="log-type">
                <span className="type-icon">{v?.icon ?? "🛡"}</span>
                {v?.label ?? log.type}
              </div>
              <span className="sev-pill" style={{ background: "rgba(34,204,119,0.12)", color: "#22cc77" }}>
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