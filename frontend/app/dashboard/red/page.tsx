"use client";

import "@/styles/redteam.css";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { useEffect, useState } from "react";

const API =  "http://localhost:5000";
  // helper function
function normalizeUrl(url: string | null) {
  if (!url) return null;
  // If it already starts with http:// or https://, leave it
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // Otherwise, prepend https://
  return `https://${url}`;
}

type AttackLog = {
  id: string;
  attackerId: string;
  targetTeamId: string;
  type: string;
  success: boolean;
  createdAt: string;
};

type Opponent = {
  id: string;
  name: string;
  score: number;
  role: string;
};

type MyTeam = {
  id: string;
  name: string;
  role: string;
  score: number;
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

const ATTACK_TYPES = [
  { value: "SQL_INJECTION",        label: "SQL Injection",              icon: "💉", severity: "CRITICAL" },
  { value: "SECURITY_MISCONFIG",   label: "Security Misconfiguration",  icon: "⚙️", severity: "HIGH"     },
  { value: "SENSITIVE_DATA",       label: "Sensitive Data Exposure",    icon: "📂", severity: "CRITICAL" },
  { value: "BROKEN_AUTH",          label: "Broken Authentication",      icon: "🔓", severity: "CRITICAL" },
  { value: "JWT_VULN",             label: "JWT Vulnerabilities",        icon: "🪪", severity: "HIGH"     }
];

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#ff2244",
  HIGH:     "#ff8800",
  MEDIUM:   "#ffcc00",
};

function getSeverity(type: string) {
  return ATTACK_TYPES.find((a) => a.value === type)?.severity ?? "MEDIUM";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { hour12: false });
}

export default function RedTeamDashboard() {
  const [logs, setLogs]         = useState<AttackLog[]>([]);
  const [matchup, setMatchup]   = useState<Matchup | null>(null);
  const [myTeam, setMyTeam]     = useState<MyTeam | null>(null);
  const [matchupError, setMatchupError] = useState<string | null>(null);

  // ── data fetching ──────────────────────────────────────────────
  async function fetchAll() {
    try {
      const [lRes, mRes] = await Promise.all([
        fetch(`${API}/attack/history`,          { credentials: "include" }),
        fetch(`${API}/competition/my-matchup`,  { credentials: "include" }),
      ]);

      const lData = await lRes.json();
      setLogs(Array.isArray(lData) ? lData : []);

      if (mRes.ok) {
        const mData: Matchup = await mRes.json();
        setMatchup(mData);
        setMyTeam(mData.myTeam);
        setMatchupError(null);
      } else {
        const err = await mRes.json();
        setMatchupError(err.error ?? "No active matchup found.");
        // Still try to get team score separately
        const tRes = await fetch(`${API}/team/me`, { credentials: "include" });
        if (tRes.ok) setMyTeam(await tRes.json());
      }
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

  // ── derived stats ──────────────────────────────────────────────
  const successCount  = logs.filter((l) => l.success).length;
  const criticalCount = logs.filter((l) => getSeverity(l.type) === "CRITICAL").length;

  return (
    <>
      <AnnouncementBanner />

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
              <div className="stat-label">Opponent Score</div>
              <div className="stat-value red">{matchup?.opponent?.score ?? "—"}</div>
              <div className="stat-sub">{matchup?.opponent?.name ?? "awaiting matchup"}</div>
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
                <br />&gt; LAUNCH YOUR FIRST EXPLOIT
                <br />&gt; _
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
                    <div className={`status-dot ${log.success ? "" : "fail"}`} />
                  </div>
                );
              })
            )}
          </section>

          {/* ——— SIDE PANEL ——— */}
          <aside className="side-panel">

            {/* ── TARGET APP CARD ── */}
            <div className="form-card">
              <div className="panel-heading" style={{ marginBottom: 16 }}>
                <h2>Target System</h2>
                <div className="panel-heading-line" />
              </div>

              {matchupError ? (
                <div className="empty-log" style={{ fontSize: 11, padding: "12px 0" }}>
                  &gt; {matchupError}
                  <br />&gt; Contact the admin.
                  <br />&gt; _
                </div>
              ) : !matchup ? (
                <div className="empty-log" style={{ fontSize: 11, padding: "12px 0" }}>
                  &gt; LOADING MATCHUP DATA...
                  <br />&gt; _
                </div>
              ) : (
                <>
                  {/* Round label */}
                  {matchup.roundLabel && (
                    <div style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 10,
                      color: "#ff2244",
                      letterSpacing: "0.15em",
                      marginBottom: 14,
                      textTransform: "uppercase",
                    }}>
                      ◈ {matchup.roundLabel}
                    </div>
                  )}

                  {/* Opponent */}
                  <div style={{ marginBottom: 20 }}>
                    <div className="form-label">Your Opponent</div>
                    <div className="target-row" style={{
                      background: "rgba(255,34,68,0.06)",
                      border: "1px solid rgba(255,34,68,0.2)",
                      borderRadius: 4,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <div>
                        <div style={{
                          fontFamily: "'Rajdhani', sans-serif",
                          fontWeight: 700,
                          fontSize: 15,
                          color: "#fff",
                          letterSpacing: "0.05em",
                        }}>
                          🔵 {matchup.opponent.name}
                        </div>
                        <div style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: 10,
                          color: "#555",
                          marginTop: 2,
                        }}>
                          BLUE TEAM · DEFENDING
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
                  <div style={{ marginBottom: 16 }}>
                    <div className="form-label">Vulnerable Application</div>
                    {matchup.targetUrl ? (
                      <a
                       href={normalizeUrl(matchup.targetUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="launch-btn"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          textDecoration: "none",
                          marginTop: 6,
                        }}
                      >
                        ⚡ OPEN TARGET APP
                      </a>
                    ) : (
                      <div style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: 11,
                        color: "#444",
                        marginTop: 6,
                        padding: "10px 12px",
                        border: "1px dashed #222",
                        borderRadius: 4,
                      }}>
                        &gt; TARGET URL NOT SET YET
                        <br />&gt; WAITING FOR ADMIN...
                      </div>
                    )}
                  </div>

                  {/* Repo URL — shown to Red too for awareness */}
                  {matchup.repoUrl && (
                    <div>
                      <div className="form-label">Resource Repo</div>
                      <a
                        href={normalizeUrl(matchup.repoUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 6,
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: 11,
                          color: "#666",
                          textDecoration: "none",
                          padding: "8px 12px",
                          border: "1px solid #1a1a1a",
                          borderRadius: 4,
                          transition: "color 0.2s, border-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.color = "#ff2244";
                          (e.currentTarget as HTMLAnchorElement).style.borderColor = "#ff224440";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.color = "#666";
                          (e.currentTarget as HTMLAnchorElement).style.borderColor = "#1a1a1a";
                        }}
                      >
                        🔗 VIEW REPO
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── ATTACK VECTOR REFERENCE ── */}
            <div className="targets-card">
              <div className="panel-heading" style={{ marginBottom: 12 }}>
                <h2>Attack Vectors</h2>
                <div className="panel-heading-line" />
              </div>
              {ATTACK_TYPES.map((a) => (
                <div className="target-row" key={a.value} style={{ alignItems: "center" }}>
                  <span style={{ marginRight: 8 }}>{a.icon}</span>
                  <span className="target-name">{a.label}</span>
                  <span
                    className="target-score"
                    style={{ color: SEVERITY_COLORS[a.severity], fontSize: 10 }}
                  >
                    {a.severity}
                  </span>
                </div>
              ))}
            </div>

          </aside>
        </div>
      </div>
    </>
  );
}