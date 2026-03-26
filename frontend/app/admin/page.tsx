"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
// SHARED UI COMPONENTS
// ─────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div
      style={{
        border: `1px solid #1a1a1a`,
        background: "#050505",
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "3px",
          height: "100%",
          background: accent || "#ffffff",
        }}
      />
      <p
        style={{
          color: "#666666",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "11px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          margin: "0 0 0.75rem",
        }}
      >
        {label}
      </p>
      <p
        style={{
          color: "#ffffff",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "2.5rem",
          fontWeight: 700,
          margin: 0,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function Badge({ role }: { role: TeamRole }) {
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "10px",
        letterSpacing: "0.1em",
        padding: "2px 8px",
        border: `1px solid ${role === "RED" ? "#331111" : "#112233"}`,
        color: role === "RED" ? "#ff4444" : "#44aaff",
        background: role === "RED" ? "#1a0808" : "#08101a",
      }}
    >
      {role}
    </span>
  );
}

function AnnouncementBadge({ type }: { type: AnnouncementType }) {
  const map: Record<
    AnnouncementType,
    { color: string; bg: string; border: string }
  > = {
    INFO: { color: "#888888", bg: "#0a0a0a", border: "#222222" },
    WARNING: { color: "#ffaa00", bg: "#1a1000", border: "#332200" },
    ALERT: { color: "#ff4444", bg: "#1a0808", border: "#331111" },
    SUCCESS: { color: "#44ff88", bg: "#081a0e", border: "#113322" },
  };
  const s = map[type];
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "9px",
        letterSpacing: "0.12em",
        padding: "2px 7px",
        border: `1px solid ${s.border}`,
        color: s.color,
        background: s.bg,
      }}
    >
      {type}
    </span>
  );
}

function ScoreTypeBadge({ type }: { type: ScoreEventType }) {
  const map: Record<
    ScoreEventType,
    { color: string; bg: string; border: string }
  > = {
    BONUS: { color: "#44ff88", bg: "#081a0e", border: "#113322" },
    PENALTY: { color: "#ff4444", bg: "#1a0808", border: "#331111" },
    MANUAL: { color: "#888888", bg: "#0a0a0a", border: "#222222" },
  };
  const s = map[type];
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "9px",
        letterSpacing: "0.12em",
        padding: "2px 7px",
        border: `1px solid ${s.border}`,
        color: s.color,
        background: s.bg,
      }}
    >
      {type}
    </span>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1rem",
        paddingBottom: "0.75rem",
        borderBottom: "1px solid #1a1a1a",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span
          style={{
            display: "inline-block",
            width: "6px",
            height: "6px",
            background: "#ffffff",
            borderRadius: "50%",
          }}
        />
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "12px",
            letterSpacing: "0.15em",
            color: "#888888",
            textTransform: "uppercase",
          }}
        >
          {title}
        </span>
      </div>
      {action}
    </div>
  );
}

function GhostButton({
  onClick,
  children,
  danger,
  success,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  success?: boolean;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const accentColor = danger ? "#ff4444" : success ? "#44ff88" : "#ffffff";
  const accentBg = danger ? "#1a0808" : success ? "#081a0e" : "#ffffff";
  const borderIdle = danger ? "#441111" : success ? "#114422" : "#333333";

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={disabled}
      style={{
        background: hover
          ? danger || success
            ? accentBg
            : "#ffffff"
          : "transparent",
        border: `1px solid ${hover ? accentColor : borderIdle}`,
        color: danger || success ? accentColor : hover ? "#000000" : "#ffffff",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "11px",
        letterSpacing: "0.1em",
        padding: "5px 12px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────
// MAIN COMPONENT
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
  const [time, setTime] = useState<Date | null>(null);

  // Score history state
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryEntry[]>([]);
  const [scoreHistoryFilter, setScoreHistoryFilter] = useState<string>("all");
  const [bonusModal, setBonusModal] = useState<{
    teamId: string;
    teamName: string;
  } | null>(null);
  const [penaltyModal, setPenaltyModal] = useState<{
    teamId: string;
    teamName: string;
  } | null>(null);
  const [bonusPoints, setBonusPoints] = useState("");
  const [bonusReason, setBonusReason] = useState("");
  const [penaltyPoints, setPenaltyPoints] = useState("");
  const [penaltyReason, setPenaltyReason] = useState("");

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annFilter, setAnnFilter] = useState<string>("all");
  const [createAnnModal, setCreateAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annMessage, setAnnMessage] = useState("");
  const [annType, setAnnType] = useState<AnnouncementType>("INFO");
  const [editAnnModal, setEditAnnModal] = useState<Announcement | null>(null);

  // Existing modals
  const [createTeamModal, setCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamRole, setNewTeamRole] = useState<TeamRole>("RED");
  const [assignModal, setAssignModal] = useState<{
    teamId: string;
    teamName: string;
  } | null>(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [scoreModal, setScoreModal] = useState<{
    teamId: string;
    teamName: string;
  } | null>(null);
  const [scoreDelta, setScoreDelta] = useState("");

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── FETCH HELPERS ──

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/dashboard`, {
        credentials: "include",
      });
      const d = await r.json();
      if (d?.stats && d?.leaderboard) setDashboard(d);
      else setDashboard(null);
    } catch {
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/users`, { credentials: "include" });
      const d = await r.json();
      setUsers(Array.isArray(d) ? d : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/teams`, { credentials: "include" });
      const d = await r.json();
      setTeams(Array.isArray(d) ? d : []);
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [a, d] = await Promise.all([
        fetch(`${API}/admin/logs/attacks`, { credentials: "include" }).then(
          (r) => r.json(),
        ),
        fetch(`${API}/admin/logs/defenses`, { credentials: "include" }).then(
          (r) => r.json(),
        ),
      ]);
      setAttackLogs(Array.isArray(a) ? a : []);
      setDefenseLogs(Array.isArray(d) ? d : []);
    } catch {
      setAttackLogs([]);
      setDefenseLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchScoreHistory = async () => {
    setLoading(true);
    const url =
      scoreHistoryFilter !== "all"
        ? `${API}/admin/scores/history?teamId=${scoreHistoryFilter}`
        : `${API}/admin/scores/history`;
    const r = await fetch(url, { credentials: "include" });
    const d = await r.json();
    setScoreHistory(d.history || []);
    setLoading(false);
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const url =
        annFilter !== "all"
          ? `${API}/admin/announcements?type=${annFilter}`
          : `${API}/admin/announcements`;
      const r = await fetch(url, { credentials: "include" });
      const d = await r.json();
      setAnnouncements(Array.isArray(d) ? d : []);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "overview") fetchDashboard();
    if (tab === "users") fetchUsers();
    if (tab === "teams") {
      fetchTeams();
      fetchUsers();
    }
    if (tab === "logs") fetchLogs();
    if (tab === "scoring") {
      fetchScoreHistory();
      fetchTeams();
    }
    if (tab === "comms") fetchAnnouncements();
  }, [tab]);

  useEffect(() => {
    if (tab === "scoring") fetchScoreHistory();
  }, [scoreHistoryFilter]);

  useEffect(() => {
    if (tab === "comms") fetchAnnouncements();
  }, [annFilter]);

  // ── EXISTING ACTIONS ──

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    const r = await fetch(`${API}/admin/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (r.ok) {
      showToast("User deleted");
      fetchUsers();
    } else showToast("Failed to delete", false);
  };

  const promoteUser = async (id: string) => {
    const r = await fetch(`${API}/admin/users/${id}/promote`, {
      method: "PATCH",
      credentials: "include",
    });
    if (r.ok) {
      showToast("User promoted to admin");
      fetchUsers();
    } else showToast("Failed to promote", false);
  };

  const createTeam = async () => {
    const r = await fetch(`${API}/admin/teams`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTeamName, role: newTeamRole }),
    });
    if (r.ok) {
      showToast("Team created");
      setCreateTeamModal(false);
      setNewTeamName("");
      fetchTeams();
    } else showToast("Failed to create team", false);
  };

  const deleteTeam = async (id: string) => {
    if (!confirm("Delete this team and all its data?")) return;
    const r = await fetch(`${API}/admin/teams/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (r.ok) {
      showToast("Team deleted");
      fetchTeams();
    } else showToast("Failed to delete", false);
  };

  const assignUser = async () => {
    if (!assignModal) return;
    const r = await fetch(`${API}/admin/teams/${assignModal.teamId}/members`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: assignUserId }),
    });
    const d = await r.json();
    if (r.ok) {
      showToast("User assigned");
      setAssignModal(null);
      setAssignUserId("");
      fetchTeams();
    } else showToast(d.error || "Failed", false);
  };

  const removeFromTeam = async (teamId: string, userId: string) => {
    const r = await fetch(`${API}/admin/teams/${teamId}/members/${userId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (r.ok) {
      showToast("Member removed");
      fetchTeams();
    } else showToast("Failed", false);
  };

  const adjustScore = async () => {
    if (!scoreModal) return;
    const r = await fetch(`${API}/admin/teams/${scoreModal.teamId}/score`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta: parseInt(scoreDelta) }),
    });
    if (r.ok) {
      showToast("Score updated");
      setScoreModal(null);
      setScoreDelta("");
      fetchTeams();
    } else showToast("Failed", false);
  };

  const resetScores = async () => {
    if (!confirm("Reset ALL team scores to 0?")) return;
    const r = await fetch(`${API}/admin/scores/reset`, {
      method: "POST",
      credentials: "include",
    });
    if (r.ok) {
      showToast("All scores reset");
      fetchTeams();
    } else showToast("Failed", false);
  };

  const clearLogs = async () => {
    if (!confirm("Clear ALL attack and defense logs? This cannot be undone."))
      return;
    const r = await fetch(`${API}/admin/logs`, {
      method: "DELETE",
      credentials: "include",
    });
    if (r.ok) {
      showToast("Logs cleared");
      fetchLogs();
    } else showToast("Failed", false);
  };

  // ── SCORING ACTIONS ──

  const awardBonus = async () => {
    if (!bonusModal) return;
    const pts = parseInt(bonusPoints);
    if (isNaN(pts) || pts <= 0) {
      showToast("Enter a valid positive number", false);
      return;
    }
    if (!bonusReason.trim()) {
      showToast("Reason is required", false);
      return;
    }
    const r = await fetch(`${API}/admin/teams/${bonusModal.teamId}/bonus`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: pts, reason: bonusReason }),
    });
    const d = await r.json();
    if (r.ok) {
      showToast(`+${pts} awarded to ${bonusModal.teamName}`);
      setBonusModal(null);
      setBonusPoints("");
      setBonusReason("");
      fetchTeams();
      fetchScoreHistory();
    } else showToast(d.error || "Failed", false);
  };

  const applyPenalty = async () => {
    if (!penaltyModal) return;
    const pts = parseInt(penaltyPoints);
    if (isNaN(pts) || pts <= 0) {
      showToast("Enter a valid positive number", false);
      return;
    }
    if (!penaltyReason.trim()) {
      showToast("Reason is required", false);
      return;
    }
    const r = await fetch(`${API}/admin/teams/${penaltyModal.teamId}/penalty`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points: pts, reason: penaltyReason }),
    });
    const d = await r.json();
    if (r.ok) {
      showToast(`-${pts} penalty applied to ${penaltyModal.teamName}`);
      setPenaltyModal(null);
      setPenaltyPoints("");
      setPenaltyReason("");
      fetchTeams();
      fetchScoreHistory();
    } else showToast(d.error || "Failed", false);
  };

  const fullScoreReset = async () => {
    if (
      !confirm(
        "HARD RESET — zero all scores AND wipe score history? This cannot be undone.",
      )
    )
      return;
    const r = await fetch(`${API}/admin/scores/full-reset`, {
      method: "POST",
      credentials: "include",
    });
    if (r.ok) {
      showToast("Full score reset complete");
      fetchTeams();
      fetchScoreHistory();
    } else showToast("Failed", false);
  };

  // ── ANNOUNCEMENT ACTIONS ──

  const createAnnouncement = async () => {
    if (!annTitle.trim()) {
      showToast("Title is required", false);
      return;
    }
    if (!annMessage.trim()) {
      showToast("Message is required", false);
      return;
    }
    const r = await fetch(`${API}/admin/announcements`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: annTitle,
        message: annMessage,
        type: annType,
      }),
    });
    if (r.ok) {
      showToast("Announcement broadcast");
      setCreateAnnModal(false);
      setAnnTitle("");
      setAnnMessage("");
      setAnnType("INFO");
      fetchAnnouncements();
    } else showToast("Failed", false);
  };

  const deleteAnnouncement = async (id: string) => {
    const r = await fetch(`${API}/admin/announcements/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (r.ok) {
      showToast("Announcement removed");
      fetchAnnouncements();
    } else showToast("Failed", false);
  };

  const clearAllAnnouncements = async () => {
    if (!confirm("Clear ALL announcements?")) return;
    const r = await fetch(`${API}/admin/announcements`, {
      method: "DELETE",
      credentials: "include",
    });
    if (r.ok) {
      showToast("All announcements cleared");
      fetchAnnouncements();
    } else showToast("Failed", false);
  };

  const togglePin = async (ann: Announcement) => {
    const r = await fetch(`${API}/admin/announcements/${ann.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !ann.pinned }),
    });
    if (r.ok) {
      showToast(ann.pinned ? "Unpinned" : "Pinned");
      fetchAnnouncements();
    } else showToast("Failed", false);
  };

  const saveEditAnn = async () => {
    if (!editAnnModal) return;
    const r = await fetch(`${API}/admin/announcements/${editAnnModal.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editAnnModal.title,
        message: editAnnModal.message,
        type: editAnnModal.type,
      }),
    });
    if (r.ok) {
      showToast("Announcement updated");
      setEditAnnModal(null);
      fetchAnnouncements();
    } else showToast("Failed", false);
  };

  // ── STYLES ──

  const inputStyle: React.CSSProperties = {
    background: "#000000",
    border: "1px solid #222222",
    color: "#ffffff",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "13px",
    padding: "8px 12px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical",
    minHeight: "80px",
  };

  const modalOverlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.92)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  };

  const modalBox: React.CSSProperties = {
    background: "#050505",
    border: "1px solid #222222",
    padding: "2rem",
    minWidth: "380px",
    maxWidth: "480px",
    width: "100%",
    position: "relative",
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "OVERVIEW" },
    { id: "teams", label: "TEAMS" },
    { id: "users", label: "PLAYERS" },
    { id: "logs", label: "LOGS" },
    { id: "scoring", label: "SCORING" },
    { id: "comms", label: "COMMS" },
  ];

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <>
      <div
        style={{
          minHeight: "100vh",
          background: "#000000",
          color: "#ffffff",
          fontFamily: "'IBM Plex Sans', sans-serif",
        }}
      >
        {/* Toast */}
        {toast && (
          <div
            style={{
              position: "fixed",
              top: "1.5rem",
              right: "1.5rem",
              zIndex: 999,
              background: "#000000",
              border: `1px solid ${toast.ok ? "#ffffff" : "#ff4444"}`,
              color: toast.ok ? "#ffffff" : "#ff4444",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "12px",
              padding: "10px 16px",
              animation: "slideIn 0.2s ease",
            }}
          >
            {toast.ok ? "●" : "×"} {toast.msg}
          </div>
        )}

        {/* Header */}
        <header
          style={{
            borderBottom: "1px solid #111111",
            padding: "0 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "56px",
            position: "sticky",
            top: 0,
            background: "#000000",
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  color: "#ffffff",
                  fontSize: "16px",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                BREACH
              </span>
              <span
                style={{
                  color: "#333333",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "16px",
                }}
              >
                /
              </span>
              <span
                style={{
                  color: "#ffffff",
                  fontSize: "16px",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontWeight: 300,
                  letterSpacing: "0.05em",
                }}
              >
                TRIX
              </span>
            </div>
            <span
              style={{
                color: "#222222",
                fontFamily: "'IBM Plex Mono', monospace",
              }}
            >
              |
            </span>
            <span
              style={{
                color: "#666666",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.1em",
              }}
            >
              SYSTEM CONTROL
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {loading && (
              <span
                style={{
                  color: "#ffffff",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "11px",
                  animation: "blink 1s infinite",
                }}
              >
                ● PROCESSING
              </span>
            )}
            <span
              style={{
                color: "#444444",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "11px",
              }}
            >
              {time?.toLocaleTimeString("en-US", { hour12: false })}
            </span>
          </div>
        </header>

        {/* Tabs */}
        <div
          style={{
            borderBottom: "1px solid #111111",
            padding: "0 2rem",
            display: "flex",
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: "transparent",
                border: "none",
                borderBottom:
                  tab === t.id ? "2px solid #ffffff" : "2px solid transparent",
                color: tab === t.id ? "#ffffff" : "#444444",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "14px 20px",
                cursor: "pointer",
                transition: "color 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <main
          style={{
            padding: "2rem",
            maxWidth: "1400px",
            margin: "0 auto",
            animation: "fadeIn 0.2s ease",
          }}
        >
          {/* ── OVERVIEW ── */}
          {tab === "overview" && !dashboard && !loading && (
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "12px",
                color: "#333333",
                padding: "2rem 0",
              }}
            >
              FAILED TO LOAD — check that the API server is running and you are
              authenticated.
            </p>
          )}
          {tab === "overview" && dashboard?.stats && dashboard?.leaderboard && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "1rem",
                }}
              >
                <StatCard label="users" value={dashboard.stats.userCount} />
                <StatCard label="teams" value={dashboard.stats.teamCount} />
                <StatCard label="attacks" value={dashboard.stats.attackCount} />
                <StatCard
                  label="defenses"
                  value={dashboard.stats.defenseCount}
                />
              </div>
              <div>
                <SectionHeader title="Global Standings" />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  {dashboard.leaderboard.map((team, i) => (
                    <div
                      key={team.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "40px 1fr auto auto auto",
                        alignItems: "center",
                        gap: "1rem",
                        padding: "14px 16px",
                        background: i === 0 ? "#111111" : "#050505",
                        border: `1px solid #1a1a1a`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: "13px",
                          color: i === 0 ? "#ffffff" : "#444444",
                        }}
                      >
                        {i + 1 < 10 ? `0${i + 1}` : i + 1}
                      </span>
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: "13px",
                          color: "#ffffff",
                        }}
                      >
                        {team.name}
                      </span>
                      <Badge role={team.role} />
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: "11px",
                          color: "#666666",
                        }}
                      >
                        {team._count.members} OPS
                      </span>
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "#ffffff",
                          minWidth: "60px",
                          textAlign: "right",
                        }}
                      >
                        {team.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TEAMS ── */}
          {tab === "teams" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              <SectionHeader
                title={`Teams (${teams.length})`}
                action={
                  <div style={{ display: "flex", gap: "8px" }}>
                    <GhostButton onClick={resetScores} danger>
                      Clear All Scores
                    </GhostButton>
                    <GhostButton onClick={() => setCreateTeamModal(true)}>
                      + Add Squad
                    </GhostButton>
                  </div>
                }
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                  gap: "1rem",
                }}
              >
                {teams.map((team) => (
                  <div
                    key={team.id}
                    style={{
                      border: `1px solid #1a1a1a`,
                      background: "#050505",
                      padding: "1.25rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "1rem",
                      }}
                    >
                      <div>
                        <Badge role={team.role} />
                        <p
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "15px",
                            color: "#ffffff",
                            margin: "8px 0 0",
                            fontWeight: 500,
                          }}
                        >
                          {team.name}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "28px",
                            fontWeight: 700,
                            color: "#ffffff",
                            margin: 0,
                            lineHeight: 1,
                          }}
                        >
                          {team.score}
                        </p>
                        <p
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "10px",
                            color: "#444444",
                            margin: "4px 0 0",
                          }}
                        >
                          RATING
                        </p>
                      </div>
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      {team.members.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "6px 0",
                            borderBottom: "1px solid #111111",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: "12px",
                              color: "#888888",
                            }}
                          >
                            {m.user.username}
                          </span>
                          <button
                            onClick={() => removeFromTeam(team.id, m.user.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#333333",
                              fontSize: "12px",
                              cursor: "pointer",
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}
                    >
                      <GhostButton
                        onClick={() =>
                          setAssignModal({
                            teamId: team.id,
                            teamName: team.name,
                          })
                        }
                      >
                        Deploy
                      </GhostButton>
                      <GhostButton
                        onClick={() =>
                          setScoreModal({
                            teamId: team.id,
                            teamName: team.name,
                          })
                        }
                      >
                        Adjust Score
                      </GhostButton>
                      <GhostButton
                        onClick={() =>
                          setBonusModal({
                            teamId: team.id,
                            teamName: team.name,
                          })
                        }
                        success
                      >
                        + Bonus
                      </GhostButton>
                      <GhostButton
                        onClick={() =>
                          setPenaltyModal({
                            teamId: team.id,
                            teamName: team.name,
                          })
                        }
                        danger
                      >
                        − Penalty
                      </GhostButton>
                      <GhostButton onClick={() => deleteTeam(team.id)} danger>
                        Purge
                      </GhostButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {tab === "users" && (
            <div>
              <SectionHeader title={`Players (${users.length})`} />
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "12px",
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                      {["Username", "Role", "Team", "Actions"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "10px 12px",
                            color: "#444444",
                            fontSize: "10px",
                            textTransform: "uppercase",
                            fontWeight: 500,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        style={{ borderBottom: "1px solid #080808" }}
                      >
                        <td style={{ padding: "12px", color: "#ffffff" }}>
                          {u.username}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              color: u.role === "admin" ? "#ffffff" : "#666666",
                              border: "1px solid #222222",
                              padding: "2px 8px",
                              fontSize: "10px",
                            }}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          {u.teamMember ? (
                            <span style={{ color: "#ffffff" }}>
                              {u.teamMember.team.name}
                            </span>
                          ) : (
                            <span style={{ color: "#222222" }}>UNASSIGNED</span>
                          )}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            {u.role !== "admin" && (
                              <GhostButton onClick={() => promoteUser(u.id)}>
                                Elevate
                              </GhostButton>
                            )}
                            <GhostButton
                              onClick={() => deleteUser(u.id)}
                              danger
                            >
                              Terminate
                            </GhostButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── LOGS ── */}
          {tab === "logs" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              <SectionHeader
                title="System Activity"
                action={
                  <GhostButton onClick={clearLogs} danger>
                    Wipe History
                  </GhostButton>
                }
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "2rem",
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "10px",
                      color: "#ffffff",
                      letterSpacing: "0.15em",
                      marginBottom: "8px",
                    }}
                  >
                    ● INCURSIONS
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      maxHeight: "500px",
                      overflowY: "auto",
                    }}
                  >
                    {attackLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          background: "#050505",
                          border: "1px solid #111111",
                          padding: "10px 12px",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "11px",
                            color: "#ffffff",
                            margin: "0 0 4px",
                          }}
                        >
                          {log.type.replace("_", " ")}: {log.attacker?.name} →{" "}
                          {log.target?.name}
                        </p>
                        <span
                          style={{
                            fontSize: "9px",
                            color: "#444444",
                            fontFamily: "'IBM Plex Mono', monospace",
                          }}
                        >
                          {new Date(log.createdAt).toLocaleTimeString()} —{" "}
                          {log.success ? "PENETRATED" : "DEFLECTED"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "10px",
                      color: "#ffffff",
                      letterSpacing: "0.15em",
                      marginBottom: "8px",
                    }}
                  >
                    ● COUNTER-OPS
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      maxHeight: "500px",
                      overflowY: "auto",
                    }}
                  >
                    {defenseLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          background: "#050505",
                          border: "1px solid #111111",
                          padding: "10px 12px",
                        }}
                      >
                        <p
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "11px",
                            color: "#ffffff",
                            margin: "0 0 4px",
                          }}
                        >
                          {log.type.replace("_", " ")}: {log.team?.name}
                        </p>
                        <span
                          style={{
                            fontSize: "9px",
                            color: "#444444",
                            fontFamily: "'IBM Plex Mono', monospace",
                          }}
                        >
                          {new Date(log.createdAt).toLocaleTimeString()} —{" "}
                          {log.success ? "REINFORCED" : "BYPASSED"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SCORING ── */}
          {tab === "scoring" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              {/* Quick actions row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: "1rem",
                }}
              >
                {teams.map((team) => (
                  <div
                    key={team.id}
                    style={{
                      border: "1px solid #1a1a1a",
                      background: "#050505",
                      padding: "1.25rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1rem",
                      }}
                    >
                      <div>
                        <Badge role={team.role} />
                        <p
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "13px",
                            color: "#ffffff",
                            margin: "6px 0 0",
                          }}
                        >
                          {team.name}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "26px",
                            fontWeight: 700,
                            color: "#ffffff",
                            margin: 0,
                            lineHeight: 1,
                          }}
                        >
                          {team.score}
                        </p>
                        <p
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "9px",
                            color: "#444444",
                            margin: "4px 0 0",
                          }}
                        >
                          PTS
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <GhostButton
                        onClick={() =>
                          setBonusModal({
                            teamId: team.id,
                            teamName: team.name,
                          })
                        }
                        success
                      >
                        + Bonus
                      </GhostButton>
                      <GhostButton
                        onClick={() =>
                          setPenaltyModal({
                            teamId: team.id,
                            teamName: team.name,
                          })
                        }
                        danger
                      >
                        − Penalty
                      </GhostButton>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hard reset */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                }}
              >
                <GhostButton onClick={resetScores} danger>
                  Soft Reset (scores only)
                </GhostButton>
                <GhostButton onClick={fullScoreReset} danger>
                  Hard Reset (scores + history)
                </GhostButton>
              </div>

              {/* Score history table */}
              <div>
                <SectionHeader
                  title="Score Audit Trail"
                  action={
                    <select
                      style={{
                        ...inputStyle,
                        width: "auto",
                        padding: "4px 10px",
                        fontSize: "11px",
                      }}
                      value={scoreHistoryFilter}
                      onChange={(e) => setScoreHistoryFilter(e.target.value)}
                    >
                      <option value="all">All Teams</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  }
                />
                {scoreHistory.length === 0 ? (
                  <p
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "12px",
                      color: "#333333",
                      padding: "2rem 0",
                    }}
                  >
                    NO EVENTS RECORDED
                  </p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "12px",
                      }}
                    >
                      <thead>
                        <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                          {["Time", "Team", "Type", "Delta", "Reason"].map(
                            (h) => (
                              <th
                                key={h}
                                style={{
                                  textAlign: "left",
                                  padding: "10px 12px",
                                  color: "#444444",
                                  fontSize: "10px",
                                  textTransform: "uppercase",
                                  fontWeight: 500,
                                }}
                              >
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {scoreHistory.map((entry) => (
                          <tr
                            key={entry.id}
                            style={{ borderBottom: "1px solid #080808" }}
                          >
                            <td
                              style={{
                                padding: "11px 12px",
                                color: "#555555",
                                fontSize: "11px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {new Date(entry.createdAt).toLocaleTimeString(
                                "en-US",
                                { hour12: false },
                              )}
                            </td>
                            <td
                              style={{ padding: "11px 12px", color: "#ffffff" }}
                            >
                              {entry.team?.name || entry.teamId.slice(0, 8)}
                            </td>
                            <td style={{ padding: "11px 12px" }}>
                              <ScoreTypeBadge type={entry.type} />
                            </td>
                            <td style={{ padding: "11px 12px" }}>
                              <span
                                style={{
                                  fontFamily: "'IBM Plex Mono', monospace",
                                  fontWeight: 700,
                                  color:
                                    entry.delta > 0 ? "#44ff88" : "#ff4444",
                                }}
                              >
                                {entry.delta > 0
                                  ? `+${entry.delta}`
                                  : entry.delta}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "11px 12px",
                                color: "#888888",
                                maxWidth: "320px",
                              }}
                            >
                              {entry.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── COMMS ── */}
          {tab === "comms" && (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              <SectionHeader
                title={`Announcements (${announcements.length})`}
                action={
                  <div style={{ display: "flex", gap: "8px" }}>
                    <select
                      style={{
                        ...inputStyle,
                        width: "auto",
                        padding: "4px 10px",
                        fontSize: "11px",
                      }}
                      value={annFilter}
                      onChange={(e) => setAnnFilter(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="INFO">INFO</option>
                      <option value="WARNING">WARNING</option>
                      <option value="ALERT">ALERT</option>
                      <option value="SUCCESS">SUCCESS</option>
                    </select>
                    <GhostButton onClick={clearAllAnnouncements} danger>
                      Clear All
                    </GhostButton>
                    <GhostButton onClick={() => setCreateAnnModal(true)}>
                      + Broadcast
                    </GhostButton>
                  </div>
                }
              />

              {announcements.length === 0 ? (
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "12px",
                    color: "#333333",
                    padding: "2rem 0",
                  }}
                >
                  NO ACTIVE TRANSMISSIONS
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {/* Pinned first */}
                  {[...announcements]
                    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
                    .map((ann) => (
                      <div
                        key={ann.id}
                        style={{
                          background: "#050505",
                          border: `1px solid ${ann.pinned ? "#2a2a1a" : "#1a1a1a"}`,
                          padding: "1rem 1.25rem",
                          position: "relative",
                        }}
                      >
                        {ann.pinned && (
                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "3px",
                              height: "100%",
                              background: "#ffaa00",
                            }}
                          />
                        )}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "1rem",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                marginBottom: "6px",
                              }}
                            >
                              <AnnouncementBadge type={ann.type} />
                              {ann.pinned && (
                                <span
                                  style={{
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    fontSize: "9px",
                                    color: "#ffaa00",
                                    letterSpacing: "0.1em",
                                  }}
                                >
                                  ⬛ PINNED
                                </span>
                              )}
                              <span
                                style={{
                                  fontFamily: "'IBM Plex Mono', monospace",
                                  fontSize: "9px",
                                  color: "#333333",
                                }}
                              >
                                {new Date(ann.createdAt).toLocaleString(
                                  "en-US",
                                  { hour12: false },
                                )}
                              </span>
                            </div>
                            <p
                              style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: "13px",
                                color: "#ffffff",
                                margin: "0 0 6px",
                                fontWeight: 500,
                              }}
                            >
                              {ann.title}
                            </p>
                            <p
                              style={{
                                fontFamily: "'IBM Plex Sans', sans-serif",
                                fontSize: "13px",
                                color: "#888888",
                                margin: 0,
                                lineHeight: 1.5,
                              }}
                            >
                              {ann.message}
                            </p>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              flexShrink: 0,
                            }}
                          >
                            <GhostButton onClick={() => togglePin(ann)}>
                              {ann.pinned ? "Unpin" : "Pin"}
                            </GhostButton>
                            <GhostButton
                              onClick={() => setEditAnnModal({ ...ann })}
                            >
                              Edit
                            </GhostButton>
                            <GhostButton
                              onClick={() => deleteAnnouncement(ann.id)}
                              danger
                            >
                              ×
                            </GhostButton>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── MODALS ── */}

        {/* Create Team */}
        {createTeamModal && (
          <div style={modalOverlay} onClick={() => setCreateTeamModal(false)}>
            <div style={modalBox} onClick={(e) => e.stopPropagation()}>
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "12px",
                  color: "#ffffff",
                  letterSpacing: "0.15em",
                  margin: "0 0 1.5rem",
                }}
              >
                NEW SQUADRON
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <input
                  style={inputStyle}
                  placeholder="Designation"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
                <select
                  style={inputStyle}
                  value={newTeamRole}
                  onChange={(e) => setNewTeamRole(e.target.value as TeamRole)}
                >
                  <option value="RED">STRIKE (RED)</option>
                  <option value="BLUE">SHIELD (BLUE)</option>
                </select>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                    marginTop: "8px",
                  }}
                >
                  <GhostButton onClick={() => setCreateTeamModal(false)}>
                    Abort
                  </GhostButton>
                  <GhostButton onClick={createTeam}>Initialize</GhostButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign User */}
        {assignModal && (
          <div style={modalOverlay} onClick={() => setAssignModal(null)}>
            <div style={modalBox} onClick={(e) => e.stopPropagation()}>
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "12px",
                  color: "#ffffff",
                  letterSpacing: "0.15em",
                  margin: "0 0 1.5rem",
                }}
              >
                ASSIGN PERSONNEL TO {assignModal.teamName}
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <select
                  style={inputStyle}
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                >
                  <option value="">Select ID…</option>
                  {users
                    .filter((u) => !u.teamMember)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username}
                      </option>
                    ))}
                </select>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                    marginTop: "8px",
                  }}
                >
                  <GhostButton onClick={() => setAssignModal(null)}>
                    Cancel
                  </GhostButton>
                  <GhostButton onClick={assignUser}>Commit</GhostButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Adjust Score */}
        {scoreModal && (
          <div style={modalOverlay} onClick={() => setScoreModal(null)}>
            <div style={modalBox} onClick={(e) => e.stopPropagation()}>
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "12px",
                  color: "#ffffff",
                  letterSpacing: "0.15em",
                  margin: "0 0 1.5rem",
                }}
              >
                MODIFY RATING: {scoreModal.teamName}
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="Delta (+ or −)"
                  value={scoreDelta}
                  onChange={(e) => setScoreDelta(e.target.value)}
                />
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                    marginTop: "8px",
                  }}
                >
                  <GhostButton onClick={() => setScoreModal(null)}>
                    Close
                  </GhostButton>
                  <GhostButton onClick={adjustScore}>Update</GhostButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bonus Modal */}
        {bonusModal && (
          <div style={modalOverlay} onClick={() => setBonusModal(null)}>
            <div style={modalBox} onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "1.5rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "12px",
                    color: "#44ff88",
                    letterSpacing: "0.15em",
                  }}
                >
                  + BONUS POINTS
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "11px",
                    color: "#444444",
                  }}
                >
                  → {bonusModal.teamName}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <input
                  style={inputStyle}
                  type="number"
                  min="1"
                  placeholder="Points to award"
                  value={bonusPoints}
                  onChange={(e) => setBonusPoints(e.target.value)}
                />
                <textarea
                  style={textareaStyle}
                  placeholder="Reason — e.g. Creative XSS chain exploit, clean mitigation response…"
                  value={bonusReason}
                  onChange={(e) => setBonusReason(e.target.value)}
                />
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "10px",
                    color: "#333333",
                    margin: 0,
                  }}
                >
                  Reason is mandatory and logged in the audit trail.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                    marginTop: "8px",
                  }}
                >
                  <GhostButton onClick={() => setBonusModal(null)}>
                    Cancel
                  </GhostButton>
                  <GhostButton onClick={awardBonus} success>
                    Award
                  </GhostButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Penalty Modal */}
        {penaltyModal && (
          <div style={modalOverlay} onClick={() => setPenaltyModal(null)}>
            <div style={modalBox} onClick={(e) => e.stopPropagation()}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "1.5rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "12px",
                    color: "#ff4444",
                    letterSpacing: "0.15em",
                  }}
                >
                  − PENALTY
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "11px",
                    color: "#444444",
                  }}
                >
                  → {penaltyModal.teamName}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <input
                  style={inputStyle}
                  type="number"
                  min="1"
                  placeholder="Points to deduct"
                  value={penaltyPoints}
                  onChange={(e) => setPenaltyPoints(e.target.value)}
                />
                <textarea
                  style={textareaStyle}
                  placeholder="Reason — e.g. Rule violation, out-of-scope attack vector…"
                  value={penaltyReason}
                  onChange={(e) => setPenaltyReason(e.target.value)}
                />
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "10px",
                    color: "#333333",
                    margin: 0,
                  }}
                >
                  Reason is mandatory and logged in the audit trail.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                    marginTop: "8px",
                  }}
                >
                  <GhostButton onClick={() => setPenaltyModal(null)}>
                    Cancel
                  </GhostButton>
                  <GhostButton onClick={applyPenalty} danger>
                    Apply
                  </GhostButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Announcement */}
        {createAnnModal && (
          <div style={modalOverlay} onClick={() => setCreateAnnModal(false)}>
            <div style={modalBox} onClick={(e) => e.stopPropagation()}>
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "12px",
                  color: "#ffffff",
                  letterSpacing: "0.15em",
                  margin: "0 0 1.5rem",
                }}
              >
                BROADCAST TRANSMISSION
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <select
                  style={inputStyle}
                  value={annType}
                  onChange={(e) =>
                    setAnnType(e.target.value as AnnouncementType)
                  }
                >
                  <option value="INFO">INFO — General update</option>
                  <option value="WARNING">WARNING — Heads up</option>
                  <option value="ALERT">ALERT — Urgent</option>
                  <option value="SUCCESS">SUCCESS — Milestone</option>
                </select>
                <input
                  style={inputStyle}
                  placeholder="Title"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                />
                <textarea
                  style={textareaStyle}
                  placeholder="Message body…"
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                />
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                    marginTop: "8px",
                  }}
                >
                  <GhostButton onClick={() => setCreateAnnModal(false)}>
                    Cancel
                  </GhostButton>
                  <GhostButton onClick={createAnnouncement}>
                    Transmit
                  </GhostButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Announcement */}
        {editAnnModal && (
          <div style={modalOverlay} onClick={() => setEditAnnModal(null)}>
            <div style={modalBox} onClick={(e) => e.stopPropagation()}>
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "12px",
                  color: "#ffffff",
                  letterSpacing: "0.15em",
                  margin: "0 0 1.5rem",
                }}
              >
                EDIT TRANSMISSION
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <select
                  style={inputStyle}
                  value={editAnnModal.type}
                  onChange={(e) =>
                    setEditAnnModal({
                      ...editAnnModal,
                      type: e.target.value as AnnouncementType,
                    })
                  }
                >
                  <option value="INFO">INFO</option>
                  <option value="WARNING">WARNING</option>
                  <option value="ALERT">ALERT</option>
                  <option value="SUCCESS">SUCCESS</option>
                </select>
                <input
                  style={inputStyle}
                  placeholder="Title"
                  value={editAnnModal.title}
                  onChange={(e) =>
                    setEditAnnModal({ ...editAnnModal, title: e.target.value })
                  }
                />
                <textarea
                  style={textareaStyle}
                  placeholder="Message body…"
                  value={editAnnModal.message}
                  onChange={(e) =>
                    setEditAnnModal({
                      ...editAnnModal,
                      message: e.target.value,
                    })
                  }
                />
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                    marginTop: "8px",
                  }}
                >
                  <GhostButton onClick={() => setEditAnnModal(null)}>
                    Cancel
                  </GhostButton>
                  <GhostButton onClick={saveEditAnn}>Save</GhostButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
