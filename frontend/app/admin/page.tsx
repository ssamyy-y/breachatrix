"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// --- TYPES ---
type TeamRole = "RED" | "BLUE";
type ScoreEventType = "BONUS" | "PENALTY" | "MANUAL";
type AnnouncementType = "INFO" | "WARNING" | "ALERT" | "SUCCESS";

interface TeamSummary {
  id: string;
  name: string;
  role: TeamRole;
  score: number;
  _count: { members: number };
}

interface DashboardData {
  stats: {
    userCount: number;
    teamCount: number;
    attackCount: number;
    defenseCount: number;
  };
  leaderboard: TeamSummary[];
}

interface User {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  teamMember?: { team: { id: string; name: string; role: TeamRole } } | null;
}

interface AttackLog {
  id: string;
  type: string;
  success: boolean;
  createdAt: string;
  attacker: { id: string; name: string };
  target: { id: string; name: string };
}

interface DefenseLog {
  id: string;
  type: string;
  success: boolean;
  createdAt: string;
  team: { id: string; name: string };
}

interface Team {
  id: string;
  name: string;
  role: TeamRole;
  score: number;
  members: {
    id: string;
    user: { id: string; username: string; role: string };
  }[];
}

interface ScoreHistoryEntry {
  id: string;
  teamId: string;
  delta: number;
  reason: string;
  type: ScoreEventType;
  createdAt: string;
  runningTotal?: number;
  team?: { id: string; name: string; role: TeamRole };
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

type Tab = "overview" | "teams" | "users" | "logs" | "scoring" | "comms";

// ─────────────────────────────────────────────
// REFINED UI COMPONENTS
// ─────────────────────────────────────────────

function StatCard({ label, value, accent = "#3b82f6" }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{
      background: "rgba(15, 15, 15, 0.6)",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(10px)",
      padding: "1.5rem",
      borderRadius: "4px",
      position: "relative",
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "2px",
        background: `linear-gradient(90deg, ${accent}, transparent)`,
      }} />
      <p style={{
        color: "#666",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10px",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        marginBottom: "0.5rem"
      }}>{label}</p>
      <p style={{
        color: "#fff",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "2rem",
        fontWeight: 600,
        margin: 0,
        textShadow: `0 0 20px ${accent}44`
      }}>{value}</p>
    </div>
  );
}

function GhostButton({ onClick, children, danger, success, disabled, small }: any) {
  const [hover, setHover] = useState(false);
  
  const getColors = () => {
    if (danger) return { border: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444" };
    if (success) return { border: "#22c55e", bg: "rgba(34, 197, 94, 0.1)", text: "#22c55e" };
    return { border: "rgba(255,255,255,0.2)", bg: "rgba(255,255,255,0.05)", text: "#fff" };
  };

  const colors = getColors();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? colors.bg : "transparent",
        border: `1px solid ${hover ? colors.border : "rgba(255,255,255,0.1)"}`,
        color: hover ? colors.text : "rgba(255,255,255,0.7)",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: small ? "9px" : "11px",
        padding: small ? "4px 8px" : "8px 16px",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        opacity: disabled ? 0.3 : 1,
        borderRadius: "2px",
      }}
    >
      {children}
    </button>
  );
}

function Badge({ role }: { role: TeamRole }) {
  const isAttack = role === "RED";

  const config = isAttack
    ? {
        label: "ATTACK",
        bg: "rgba(239, 68, 68, 0.15)",
        color: "#f87171",
        border: "rgba(239, 68, 68, 0.3)",
      }
    : {
        label: "DEFENSE",
        bg: "rgba(59, 130, 246, 0.15)",
        color: "#60a5fa",
        border: "rgba(59, 130, 246, 0.3)",
      };

  return (
    <span
      style={{
        fontSize: "9px",
        fontWeight: 700,
        padding: "2px 6px",
        borderRadius: "2px",
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontFamily: "'IBM Plex Mono', monospace",
        letterSpacing: "0.05em"
      }}
    >
      {config.label}
    </span>
  );
}
// ─────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [attackLogs, setAttackLogs] = useState<AttackLog[]>([]);
  const [defenseLogs, setDefenseLogs] = useState<DefenseLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [time, setTime] = useState<string>("");

  // Modals & Forms State (Keeping your existing logic)
  const [createTeamModal, setCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamRole, setNewTeamRole] = useState<TeamRole>("RED");
  const [bonusModal, setBonusModal] = useState<{ teamId: string; teamName: string } | null>(null);
  const [bonusPoints, setBonusPoints] = useState("");
  const [bonusReason, setBonusReason] = useState("");

  const [selectedTeamId, setSelectedTeamId] = useState("");
const [points, setPoints] = useState("");
const [reason, setReason] = useState("");

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // --- API CALLS (Assuming your existing logic remains the same) ---
  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/dashboard`, { credentials: "include" });
      const d = await r.json();
      if (d?.stats) setDashboard(d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/teams`, { credentials: "include" });
      const d = await r.json();
      setTeams(Array.isArray(d) ? d : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
  setLoading(true);
  try {
    const r = await fetch(`${API}/admin/users`, {
      credentials: "include",
    });
    const d = await r.json();
    setUsers(Array.isArray(d) ? d : []);
  } catch (e) {
    console.error(e);
  } finally {
    setLoading(false);
  }
};

const fetchLogs = async () => {
  setLoading(true);
  try {
    const [a, d] = await Promise.all([
      fetch(`${API}/admin/logs/attacks`, { credentials: "include" }),
      fetch(`${API}/admin/logs/defenses`, { credentials: "include" }),
    ]);

    const attacks = await a.json();
    const defenses = await d.json();

    setAttackLogs(Array.isArray(attacks) ? attacks : []);
    setDefenseLogs(Array.isArray(defenses) ? defenses : []);
  } catch (e) {
    console.error(e);
  } finally {
    setLoading(false);
  }
};

const [scoreHistory, setScoreHistory] = useState<ScoreHistoryEntry[]>([]);

const fetchScoring = async () => {
  setLoading(true);
  try {
    const r = await fetch(`${API}/admin/scores/history`, {
      credentials: "include",
    });
    const d = await r.json();

    // ⚠️ your backend returns { history, grouped }
    setScoreHistory(Array.isArray(d.history) ? d.history : []);
  } catch (e) {
    console.error(e);
  } finally {
    setLoading(false);
  }
};

const [announcements, setAnnouncements] = useState<Announcement[]>([]);

const fetchComms = async () => {
  setLoading(true);
  try {
    const r = await fetch(`${API}/admin/announcements`, {
      credentials: "include",
    });
    const d = await r.json();
    setAnnouncements(Array.isArray(d) ? d : []);
  } catch (e) {
    console.error(e);
  } finally {
    setLoading(false);
  }
};

const applyBonus = async () => {
  if (!selectedTeamId || !points || !reason) {
    return showToast("Fill all fields", false);
  }

  try {
    const r = await fetch(`${API}/admin/teams/${selectedTeamId}/bonus`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        points: Number(points),
        reason,
      }),
    });

    const d = await r.json();

    if (!r.ok) throw new Error(d.error);

    showToast("Bonus applied");
    fetchScoring(); // refresh history
    fetchTeams();   // refresh scores
  } catch (e: any) {
    showToast(e.message, false);
  }
};

const applyPenalty = async () => {
  if (!selectedTeamId || !points || !reason) {
    return showToast("Fill all fields", false);
  }

  try {
    const r = await fetch(`${API}/admin/teams/${selectedTeamId}/penalty`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        points: Number(points),
        reason,
      }),
    });

    const d = await r.json();

    if (!r.ok) throw new Error(d.error);

    showToast("Penalty applied");
    fetchScoring();
    fetchTeams();
  } catch (e: any) {
    showToast(e.message, false);
  }
};

 useEffect(() => {
  if (tab === "overview") fetchDashboard();
  if (tab === "teams") fetchTeams();
  if (tab === "users") fetchUsers();
  if (tab === "logs") fetchLogs();
  if (tab === "scoring") {
  fetchScoring();
  fetchTeams(); // REQUIRED for dropdown
}
  if (tab === "comms") fetchComms();
}, [tab]);
  // ── RENDER ──
  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 50% 0%, #111 0%, #050505 100%)",
      color: "#e2e2e2",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Dynamic Toast */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          zIndex: 1000,
          background: "#111",
          borderLeft: `4px solid ${toast.ok ? "#22c55e" : "#ef4444"}`,
          padding: "1rem 1.5rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <span style={{ color: toast.ok ? "#22c55e" : "#ef4444" }}>{toast.ok ? "SUCCESS" : "ERROR"}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Modern Header */}
      <header style={{
        height: "64px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "0 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(5, 5, 5, 0.8)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "32px", height: "32px", background: "#fff", borderRadius: "4px", display: "grid", placeItems: "center" }}>
            <div style={{ width: "16px", height: "16px", border: "3px solid #000" }} />
          </div>
          <div style={{ letterSpacing: "0.1em", fontWeight: 800, fontSize: "14px", fontFamily: "'IBM Plex Mono', monospace" }}>
            BREACH <span style={{ fontWeight: 300, color: "#666" }}>@trix</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10px", color: "#3b82f6" }}>
              <div className="spinner" /> SYNCING...
            </div>
          )}
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "#666" }}>
            {time || "00:00:00"}
          </div>
        </div>
      </header>

      {/* Sidebar-style Tab Navigation */}
      <div style={{ display: "flex", maxWidth: "1600px", margin: "0 auto" }}>
        <nav style={{
          width: "240px",
          padding: "2rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          minHeight: "calc(100vh - 64px)"
        }}>
          {["overview", "teams", "users", "logs", "scoring", "comms"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as Tab)}
              style={{
                textAlign: "left",
                padding: "10px 16px",
                background: tab === t ? "rgba(255,255,255,0.05)" : "transparent",
                border: "none",
                borderRadius: "4px",
                color: tab === t ? "#fff" : "#666",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {tab === t && <span style={{ marginRight: "8px", color: "#3b82f6" }}>&gt;</span>}
              {t}
            </button>
          ))}
        </nav>

        {/* Main Workspace */}
        <main style={{ flex: 1, padding: "2.5rem" }}>
          {tab === "overview" && dashboard && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}>
                <StatCard label="Total Operatives" value={dashboard.stats.userCount} accent="#3b82f6" />
                <StatCard label="Active Squads" value={dashboard.stats.teamCount} accent="#a855f7" />
                <StatCard label="Incursions" value={dashboard.stats.attackCount} accent="#ef4444" />
                <StatCard label="Neutralizations" value={dashboard.stats.defenseCount} accent="#22c55e" />
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ padding: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#888", margin: 0 }}>Leaderboard Output</h3>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 10px #22c55e" }} />
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'IBM Plex Mono', monospace" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#444", fontSize: "10px", textTransform: "uppercase" }}>
                      <th style={{ padding: "1rem" }}>Rank</th>
                      <th style={{ padding: "1rem" }}>Squad</th>
                      <th style={{ padding: "1rem" }}>Role</th>
                      <th style={{ padding: "1rem" }}>Ops</th>
                      <th style={{ padding: "1rem", textAlign: "right" }}>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.leaderboard.map((team, i) => (
                      <tr key={team.id} style={{ borderTop: "1px solid rgba(255,255,255,0.02)", fontSize: "13px" }}>
                        <td style={{ padding: "1rem", color: "#666" }}>{i + 1}</td>
                        <td style={{ padding: "1rem", fontWeight: 600 }}>{team.name}</td>
                        <td style={{ padding: "1rem" }}><Badge role={team.role} /></td>
                        <td style={{ padding: "1rem", color: "#666" }}>{team._count.members}</td>
                        <td style={{ padding: "1rem", textAlign: "right", color: "#3b82f6", fontWeight: 700 }}>{team.score.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "teams" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <h2 style={{ fontSize: "24px", margin: "0 0 8px 0" }}>Tactical Units</h2>
                  <p style={{ color: "#666", fontSize: "13px" }}>Manage team rosters and manual score adjustments.</p>
                </div>
                <GhostButton onClick={() => setCreateTeamModal(true)} success>Initialize Squad</GhostButton>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
                {teams.map(team => (
                  <div key={team.id} style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: "6px",
                    padding: "1.5rem"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                      <div>
                        <Badge role={team.role} />
                        <h4 style={{ margin: "10px 0 4px 0", fontSize: "18px" }}>{team.name}</h4>
                        <span style={{ fontSize: "10px", color: "#666", fontFamily: "'IBM Plex Mono', monospace" }}>UID: {team.id.slice(0, 8)}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "24px", fontWeight: 700, color: "#fff" }}>{team.score}</div>
                        <div style={{ fontSize: "9px", color: "#444" }}>PTS</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      <GhostButton small onClick={() => {}}>Roster</GhostButton>
                      <GhostButton small onClick={() => setBonusModal({ teamId: team.id, teamName: team.name })} success>Bonus</GhostButton>
                      <GhostButton small onClick={() => {}} danger>Penalty</GhostButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "users" && (
  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
    <h2 style={{ fontSize: "24px", margin: 0 }}>Operatives</h2>

    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: "8px",
      overflow: "hidden"
    }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        fontFamily: "'IBM Plex Mono', monospace"
      }}>
        <thead>
          <tr style={{ color: "#444", fontSize: "10px", textTransform: "uppercase" }}>
            <th style={{ padding: "1rem" }}>Username</th>
            <th style={{ padding: "1rem" }}>Role</th>
            <th style={{ padding: "1rem" }}>Team</th>
            <th style={{ padding: "1rem" }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} style={{ borderTop: "1px solid rgba(255,255,255,0.02)" }}>
              <td style={{ padding: "1rem" }}>{u.username}</td>
              <td style={{ padding: "1rem", color: "#666" }}>{u.role}</td>
              <td style={{ padding: "1rem" }}>
                {u.teamMember?.team?.name || "—"}
              </td>
              <td style={{ padding: "1rem", color: "#666" }}>
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

{tab === "logs" && (
  <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
    <h2>Activity Logs</h2>

    {/* ATTACK */}
    <div>
      <h4 style={{ color: "#ef4444" }}>Attack Events</h4>

      {attackLogs.map(log => (
        <div key={log.id} style={{
          padding: "12px",
          borderBottom: "1px solid rgba(255,255,255,0.05)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <span style={{
                color: log.success ? "#22c55e" : "#ef4444",
                fontWeight: 600
              }}>
                {log.success ? "SUCCESS" : "FAIL"}
              </span>

              {" — "}
              <strong>{log.attacker.name}</strong>
              {" → "}
              <strong>{log.target.name}</strong>
              {" "}
              <span style={{ color: "#666" }}>({log.type})</span>
            </div>

            <div style={{ fontSize: "10px", color: "#555" }}>
              {new Date(log.createdAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* DEFENSE */}
    <div>
      <h4 style={{ color: "#3b82f6" }}>Defense Events</h4>

      {defenseLogs.map(log => (
        <div key={log.id} style={{
          padding: "12px",
          borderBottom: "1px solid rgba(255,255,255,0.05)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <span style={{
                color: log.success ? "#22c55e" : "#ef4444",
                fontWeight: 600
              }}>
                {log.success ? "SUCCESS" : "FAIL"}
              </span>

              {" — "}
              <strong>{log.team.name}</strong>
              {" "}
              <span style={{ color: "#666" }}>({log.type})</span>
            </div>

            <div style={{ fontSize: "10px", color: "#555" }}>
              {new Date(log.createdAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{tab === "scoring" && (
  
  <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
    <div style={{
  padding: "1.5rem",
  border: "1px solid rgba(255,255,255,0.05)",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.02)",
  display: "flex",
  flexDirection: "column",
  gap: "1rem"
}}>
  <h3 style={{ margin: 0 }}>Manual Score Control</h3>

  {/* TEAM SELECT */}
  <select
    value={selectedTeamId}
    onChange={(e) => setSelectedTeamId(e.target.value)}
    style={{
      padding: "10px",
      background: "#0a0a0a",
      border: "1px solid #222",
      color: "#fff"
    }}
  >
    <option value="">Select Team</option>
    {teams.map(t => (
      <option key={t.id} value={t.id}>
        {t.name} ({t.role})
      </option>
    ))}
  </select>

  {/* POINTS */}
  <input
    type="number"
    placeholder="Points"
    value={points}
    onChange={(e) => setPoints(e.target.value)}
    style={{
      padding: "10px",
      background: "#0a0a0a",
      border: "1px solid #222",
      color: "#fff"
    }}
  />

  {/* REASON */}
  <input
    type="text"
    placeholder="Reason"
    value={reason}
    onChange={(e) => setReason(e.target.value)}
    style={{
      padding: "10px",
      background: "#0a0a0a",
      border: "1px solid #222",
      color: "#fff"
    }}
  />

  {/* ACTIONS */}
  <div style={{ display: "flex", gap: "10px" }}>
    <GhostButton success onClick={applyBonus}>
      + Bonus
    </GhostButton>

    <GhostButton danger onClick={applyPenalty}>
      - Penalty
    </GhostButton>
  </div>
</div>
    <h2>Score History</h2>

    {scoreHistory.map(s => (
      <div key={s.id} style={{
        padding: "1rem",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: "6px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Badge role={s.team?.role || "RED"} />
              <strong>{s.team?.name}</strong>
            </div>

            <div style={{ fontSize: "12px", color: "#888" }}>
              {s.reason}
            </div>
          </div>

          <div style={{
            fontWeight: 700,
            color: s.delta > 0 ? "#22c55e" : "#ef4444"
          }}>
            {s.delta > 0 ? "+" : ""}{s.delta}
          </div>
        </div>

        <div style={{ fontSize: "10px", color: "#555", marginTop: "6px" }}>
          {s.type} • {new Date(s.createdAt).toLocaleString()}
        </div>
      </div>
    ))}
  </div>
)}

{tab === "comms" && (
  <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
    <h2>Announcements</h2>

    {announcements.map(a => (
      <div key={a.id} style={{
        padding: "1rem",
        border: "1px solid rgba(255,255,255,0.05)",
        borderLeft: `4px solid ${
          a.type === "ALERT" ? "#ef4444" :
          a.type === "WARNING" ? "#f59e0b" :
          a.type === "SUCCESS" ? "#22c55e" :
          "#3b82f6"
        }`,
        borderRadius: "6px",
        background: a.pinned ? "rgba(255,255,255,0.03)" : "transparent"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong>{a.title}</strong>
          {a.pinned && (
            <span style={{ fontSize: "10px", color: "#f59e0b" }}>
              PINNED
            </span>
          )}
        </div>

        <p style={{ margin: "8px 0", color: "#ccc" }}>
          {a.message}
        </p>

        <div style={{ fontSize: "10px", color: "#555" }}>
          {new Date(a.createdAt).toLocaleString()}
        </div>
      </div>
    ))}
  </div>
)}
        </main>
      </div>

      {/* Global CSS for subtle animations */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600;700&family=Inter:wght@300;400;600;800&display=swap');
        
        body { margin: 0; padding: 0; overflow-x: hidden; }
        
        .spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(59, 130, 246, 0.2);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #050505;
        }
        ::-webkit-scrollbar-thumb {
          background: #222;
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #333;
        }
      `}</style>
    </div>
  );
}