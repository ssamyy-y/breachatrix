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

interface Matchup {
  id: string;
  roundLabel: string | null;
  targetUrl: string | null;
  repoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  redTeam: { id: string; name: string; score: number };
  blueTeam: { id: string; name: string; score: number };
}

type Tab = "overview" | "teams" | "users" | "logs" | "scoring" | "comms" | "matchups";

// ─────────────────────────────────────────────
// SHARED UI COMPONENTS (unchanged from original)
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
        position: "absolute", top: 0, left: 0,
        width: "100%", height: "2px",
        background: `linear-gradient(90deg, ${accent}, transparent)`,
      }} />
      <p style={{ color: "#666", fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" }}>{label}</p>
      <p style={{ color: "#fff", fontFamily: "'IBM Plex Mono', monospace", fontSize: "2rem", fontWeight: 600, margin: 0, textShadow: `0 0 20px ${accent}44` }}>{value}</p>
    </div>
  );
}

function GhostButton({ onClick, children, danger, success, disabled, small, active }: any) {
  const [hover, setHover] = useState(false);
  const getColors = () => {
    if (danger)   return { border: "#ef4444", bg: "rgba(239,68,68,0.1)",   text: "#ef4444" };
    if (success)  return { border: "#22c55e", bg: "rgba(34,197,94,0.1)",   text: "#22c55e" };
    if (active)   return { border: "#3b82f6", bg: "rgba(59,130,246,0.1)",  text: "#3b82f6" };
    return              { border: "rgba(255,255,255,0.2)", bg: "rgba(255,255,255,0.05)", text: "#fff" };
  };
  const colors = getColors();
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: (hover || active) ? colors.bg : "transparent",
        border: `1px solid ${(hover || active) ? colors.border : "rgba(255,255,255,0.1)"}`,
        color: (hover || active) ? colors.text : "rgba(255,255,255,0.7)",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: small ? "9px" : "11px",
        padding: small ? "4px 8px" : "8px 16px",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        opacity: disabled ? 0.3 : 1,
        borderRadius: "2px",
        whiteSpace: "nowrap" as const,
      }}
    >
      {children}
    </button>
  );
}

function Badge({ role }: { role: TeamRole }) {
  const config = role === "RED"
    ? { label: "ATTACK", bg: "rgba(239,68,68,0.15)", color: "#f87171", border: "rgba(239,68,68,0.3)" }
    : { label: "DEFENSE", bg: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "rgba(59,130,246,0.3)" };
  return (
    <span style={{
      fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "2px",
      background: config.bg, color: config.color, border: `1px solid ${config.border}`,
      fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.05em",
    }}>
      {config.label}
    </span>
  );
}

const TYPE_CONFIG: Record<AnnouncementType, { color: string; bg: string; label: string }> = {
  INFO:    { color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  label: "INFO"    },
  WARNING: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  label: "WARNING" },
  ALERT:   { color: "#ef4444", bg: "rgba(239,68,68,0.12)",   label: "ALERT"   },
  SUCCESS: { color: "#22c55e", bg: "rgba(34,197,94,0.12)",   label: "SUCCESS" },
};

// ─────────────────────────────────────────────
// INLINE INPUT STYLES (reusable)
// ─────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 14px",
  background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "4px", color: "#fff",
  fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#555",
  textTransform: "uppercase" as const, letterSpacing: "0.1em",
  display: "block", marginBottom: "8px",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

// ─────────────────────────────────────────────
// MATCHUPS TAB COMPONENT
// ─────────────────────────────────────────────

function MatchupsTab({
  teams,
  showToast,
}: {
  teams: Team[];
  showToast: (msg: string, ok?: boolean) => void;
}) {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [loading, setLoading] = useState(false);

  // Create form
  const [redTeamId, setRedTeamId]   = useState("");
  const [blueTeamId, setBlueTeamId] = useState("");
  const [roundLabel, setRoundLabel] = useState("");
  const [targetUrl, setTargetUrl]   = useState("");
  const [repoUrl, setRepoUrl]       = useState("");
  const [creating, setCreating]     = useState(false);

  // Edit modal state
  const [editId, setEditId]             = useState<string | null>(null);
  const [editTargetUrl, setEditTargetUrl] = useState("");
  const [editRepoUrl, setEditRepoUrl]   = useState("");
  const [editLabel, setEditLabel]       = useState("");
  const [editActive, setEditActive]     = useState(true);
  const [saving, setSaving]             = useState(false);

  // Filter
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const redTeams  = teams.filter((t) => t.role === "RED");
  const blueTeams = teams.filter((t) => t.role === "BLUE");

  const fetchMatchups = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/matchups`, { credentials: "include" });
      const d = await r.json();
      setMatchups(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMatchups(); }, []);

  const createMatchup = async () => {
    if (!redTeamId || !blueTeamId) return showToast("Select both teams", false);
    setCreating(true);
    try {
      const r = await fetch(`${API}/admin/matchups`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          redTeamId, blueTeamId,
          roundLabel: roundLabel.trim() || null,
          targetUrl:  targetUrl.trim()  || null,
          repoUrl:    repoUrl.trim()    || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      showToast("Matchup created");
      setRedTeamId(""); setBlueTeamId("");
      setRoundLabel(""); setTargetUrl(""); setRepoUrl("");
      fetchMatchups();
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (m: Matchup) => {
    setEditId(m.id);
    setEditTargetUrl(m.targetUrl ?? "");
    setEditRepoUrl(m.repoUrl ?? "");
    setEditLabel(m.roundLabel ?? "");
    setEditActive(m.isActive);
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/admin/matchups/${editId}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl:  editTargetUrl.trim() || null,
          repoUrl:    editRepoUrl.trim()   || null,
          roundLabel: editLabel.trim()     || null,
          isActive:   editActive,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      showToast("Matchup updated");
      setEditId(null);
      fetchMatchups();
    } catch (e: any) {
      showToast(e.message, false);
    } finally {
      setSaving(false);
    }
  };

  const deleteMatchup = async (id: string) => {
    if (!confirm("Delete this matchup?")) return;
    try {
      const r = await fetch(`${API}/admin/matchups/${id}`, {
        method: "DELETE", credentials: "include",
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
      showToast("Matchup deleted");
      setMatchups((prev) => prev.filter((m) => m.id !== id));
    } catch (e: any) {
      showToast(e.message, false);
    }
  };

  const deactivateAll = async () => {
    if (!confirm("Deactivate ALL active matchups?")) return;
    try {
      const r = await fetch(`${API}/admin/matchups/deactivate-all`, {
        method: "POST", credentials: "include",
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      showToast(d.message);
      fetchMatchups();
    } catch (e: any) {
      showToast(e.message, false);
    }
  };

  const filtered = matchups.filter((m) => {
    if (filter === "active")   return m.isActive;
    if (filter === "inactive") return !m.isActive;
    return true;
  });

  const activeCount = matchups.filter((m) => m.isActive).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h2 style={{ fontSize: "24px", margin: "0 0 6px 0" }}>Matchup Control</h2>
          <p style={{ color: "#666", fontSize: "13px", margin: 0 }}>
            Assign 1v1 Red vs Blue pairs and configure live target URLs.
            {activeCount > 0 && (
              <span style={{ marginLeft: 10, color: "#22c55e", fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px" }}>
                {activeCount} ACTIVE
              </span>
            )}
          </p>
        </div>
        {activeCount > 0 && (
          <GhostButton danger onClick={deactivateAll}>Deactivate All</GhostButton>
        )}
      </div>

      {/* ── Create Matchup Form ── */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "8px",
        overflow: "hidden",
      }}>
        {/* form header */}
        <div style={{
          padding: "1rem 1.5rem",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a855f7" }} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#888" }}>
            New Matchup
          </span>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Team pair row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "1rem", alignItems: "end" }}>
            <div>
              <label style={labelStyle}>Red Team (Attacker)</label>
              <select
                value={redTeamId}
                onChange={(e) => setRedTeamId(e.target.value)}
                style={{ ...selectStyle, borderColor: redTeamId ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)" }}
              >
                <option value="">Select RED team...</option>
                {redTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px",
              color: "#444", paddingBottom: "10px", letterSpacing: "0.1em",
            }}>
              VS
            </div>

            <div>
              <label style={labelStyle}>Blue Team (Defender)</label>
              <select
                value={blueTeamId}
                onChange={(e) => setBlueTeamId(e.target.value)}
                style={{ ...selectStyle, borderColor: blueTeamId ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)" }}
              >
                <option value="">Select BLUE team...</option>
                {blueTeams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Round label */}
          <div>
            <label style={labelStyle}>Round Label <span style={{ color: "#333" }}>(optional)</span></label>
            <input
              type="text"
              placeholder="e.g. Finals Round 1"
              value={roundLabel}
              onChange={(e) => setRoundLabel(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* URL row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>
                Target URL
                <span style={{ color: "#333", marginLeft: 6 }}>(vulnerable app)</span>
              </label>
              <input
                type="url"
                placeholder="https://nexcorp.breach.local"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Repo URL
                <span style={{ color: "#333", marginLeft: 6 }}>(shown to blue)</span>
              </label>
              <input
                type="url"
                placeholder="https://github.com/org/nexcorp"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Submit */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={createMatchup}
              disabled={creating || !redTeamId || !blueTeamId}
              style={{
                padding: "10px 28px",
                background: (!redTeamId || !blueTeamId || creating) ? "transparent" : "rgba(168,85,247,0.12)",
                border: "1px solid rgba(168,85,247,0.5)",
                borderRadius: "4px",
                color: "#c084fc",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "11px", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.1em",
                cursor: (!redTeamId || !blueTeamId || creating) ? "not-allowed" : "pointer",
                opacity: (!redTeamId || !blueTeamId) ? 0.35 : 1,
                transition: "all 0.2s",
              }}
            >
              {creating ? "Creating..." : "⚡ Create Matchup"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter pills ── */}
      {matchups.length > 0 && (
        <div style={{ display: "flex", gap: "8px" }}>
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "5px 14px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "10px", fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase",
                cursor: "pointer", borderRadius: "2px",
                border: `1px solid ${filter === f ? "rgba(168,85,247,0.5)" : "rgba(255,255,255,0.07)"}`,
                background: filter === f ? "rgba(168,85,247,0.1)" : "transparent",
                color: filter === f ? "#c084fc" : "#555",
                transition: "all 0.15s",
              }}
            >
              {f}
              {f === "active"   && <span style={{ marginLeft: 6, color: "#22c55e" }}>{activeCount}</span>}
              {f === "inactive" && <span style={{ marginLeft: 6, color: "#444" }}>{matchups.length - activeCount}</span>}
              {f === "all"      && <span style={{ marginLeft: 6, color: "#555" }}>{matchups.length}</span>}
            </button>
          ))}
        </div>
      )}

      {/* ── Matchup List ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#333", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px" }}>
          LOADING...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: "3rem", textAlign: "center", color: "#333",
          fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px",
          border: "1px dashed rgba(255,255,255,0.05)", borderRadius: "8px",
        }}>
          {matchups.length === 0 ? "NO MATCHUPS CREATED YET" : `NO ${filter.toUpperCase()} MATCHUPS`}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((m) => (
            <MatchupCard
              key={m.id}
              matchup={m}
              onEdit={openEdit}
              onDelete={deleteMatchup}
            />
          ))}
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editId && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditId(null); }}
        >
          <div style={{
            background: "#0d0d0d",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "2rem",
            width: "100%", maxWidth: "520px",
            display: "flex", flexDirection: "column", gap: "1.25rem",
          }}>
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>
                  Edit Matchup
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#888" }}>
                  {matchups.find(m => m.id === editId)?.redTeam.name} vs {matchups.find(m => m.id === editId)?.blueTeam.name}
                </div>
              </div>
              <button
                onClick={() => setEditId(null)}
                style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Accent line */}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

            {/* Round label */}
            <div>
              <label style={labelStyle}>Round Label</label>
              <input
                type="text"
                placeholder="e.g. Finals Round 1"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                style={inputStyle}
              />
            </div>

            {/* Target URL */}
            <div>
              <label style={labelStyle}>
                Target URL
                <span style={{ color: "#444", marginLeft: 6 }}>· broadcasts immediately to both teams</span>
              </label>
              <input
                type="url"
                placeholder="https://nexcorp.breach.local"
                value={editTargetUrl}
                onChange={(e) => setEditTargetUrl(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: editTargetUrl ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.08)",
                }}
              />
            </div>

            {/* Repo URL */}
            <div>
              <label style={labelStyle}>
                Repo URL
                <span style={{ color: "#444", marginLeft: 6 }}>· shown to blue team</span>
              </label>
              <input
                type="url"
                placeholder="https://github.com/org/nexcorp"
                value={editRepoUrl}
                onChange={(e) => setEditRepoUrl(e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: editRepoUrl ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.08)",
                }}
              />
            </div>

            {/* Active toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Status</label>
              <button
                onClick={() => setEditActive((v) => !v)}
                style={{
                  padding: "6px 16px",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "10px", fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase",
                  cursor: "pointer", borderRadius: "2px",
                  border: `1px solid ${editActive ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)"}`,
                  background: editActive ? "rgba(34,197,94,0.1)" : "transparent",
                  color: editActive ? "#22c55e" : "#555",
                  transition: "all 0.15s",
                }}
              >
                {editActive ? "● ACTIVE" : "○ INACTIVE"}
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "0.5rem" }}>
              <GhostButton onClick={() => setEditId(null)}>Cancel</GhostButton>
              <button
                onClick={saveEdit}
                disabled={saving}
                style={{
                  padding: "10px 24px",
                  background: "rgba(168,85,247,0.12)",
                  border: "1px solid rgba(168,85,247,0.5)",
                  borderRadius: "4px", color: "#c084fc",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "11px", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MATCHUP CARD
// ─────────────────────────────────────────────

function MatchupCard({
  matchup,
  onEdit,
  onDelete,
}: {
  matchup: Matchup;
  onEdit: (m: Matchup) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div style={{
      padding: "1.25rem 1.5rem",
      background: matchup.isActive ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.01)",
      border: `1px solid ${matchup.isActive ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.04)"}`,
      borderRadius: "6px",
      transition: "border-color 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5rem" }}>

        {/* Status dot */}
        <div style={{ paddingTop: "4px" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: matchup.isActive ? "#22c55e" : "#333",
            boxShadow: matchup.isActive ? "0 0 8px #22c55e66" : "none",
            flexShrink: 0,
          }} />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Round label + timestamp */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
            {matchup.roundLabel && (
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", fontWeight: 700,
                padding: "2px 8px", borderRadius: "2px",
                background: "rgba(168,85,247,0.15)", color: "#c084fc",
                border: "1px solid rgba(168,85,247,0.3)", letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>
                {matchup.roundLabel}
              </span>
            )}
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#444" }}>
              {new Date(matchup.createdAt).toLocaleString()}
            </span>
          </div>

          {/* Teams */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
            {/* Red */}
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "6px 12px",
              background: "rgba(239,68,68,0.07)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "4px",
            }}>
              <span style={{ fontSize: "11px" }}>🔴</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", fontWeight: 600, color: "#f87171" }}>
                {matchup.redTeam.name}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#444" }}>
                {matchup.redTeam.score} pts
              </span>
            </div>

            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#333", letterSpacing: "0.1em" }}>VS</span>

            {/* Blue */}
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "6px 12px",
              background: "rgba(59,130,246,0.07)",
              border: "1px solid rgba(59,130,246,0.2)",
              borderRadius: "4px",
            }}>
              <span style={{ fontSize: "11px" }}>🔵</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", fontWeight: 600, color: "#60a5fa" }}>
                {matchup.blueTeam.name}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#444" }}>
                {matchup.blueTeam.score} pts
              </span>
            </div>
          </div>

          {/* URLs */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {matchup.targetUrl ? (
              <a
                href={matchup.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px",
                  color: "#ef4444", textDecoration: "none",
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "3px 10px",
                  background: "rgba(239,68,68,0.06)",
                  border: "1px solid rgba(239,68,68,0.2)", borderRadius: "2px",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
              >
                ⚡ Target App ↗
              </a>
            ) : (
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#333",
                padding: "3px 10px", border: "1px dashed #1e1e1e", borderRadius: "2px",
              }}>
                No target URL set
              </span>
            )}

            {matchup.repoUrl ? (
              <a
                href={matchup.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px",
                  color: "#60a5fa", textDecoration: "none",
                  display: "flex", alignItems: "center", gap: "5px",
                  padding: "3px 10px",
                  background: "rgba(59,130,246,0.06)",
                  border: "1px solid rgba(59,130,246,0.2)", borderRadius: "2px",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.06)")}
              >
                🔗 Repo ↗
              </a>
            ) : (
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#333",
                padding: "3px 10px", border: "1px dashed #1e1e1e", borderRadius: "2px",
              }}>
                No repo URL set
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <GhostButton small onClick={() => onEdit(matchup)}>Edit</GhostButton>
          <GhostButton small danger onClick={() => onDelete(matchup.id)}>Delete</GhostButton>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────

export default function AdminDashboard() {
  const [tab, setTab]           = useState<Tab>("overview");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [users, setUsers]       = useState<User[]>([]);
  const [teams, setTeams]       = useState<Team[]>([]);
  const [attackLogs, setAttackLogs]   = useState<AttackLog[]>([]);
  const [defenseLogs, setDefenseLogs] = useState<DefenseLog[]>([]);
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);
  const [time, setTime]         = useState<string>("");

  const [bonusModal, setBonusModal] = useState<{ teamId: string; teamName: string } | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [points, setPoints]     = useState("");
  const [reason, setReason]     = useState("");

  const [scoreHistory, setScoreHistory]     = useState<ScoreHistoryEntry[]>([]);
  const [announcements, setAnnouncements]   = useState<Announcement[]>([]);

  const [newTitle, setNewTitle]   = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType]     = useState<AnnouncementType>("INFO");
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);

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

  // --- API CALLS ---
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
      const r = await fetch(`${API}/admin/users`, { credentials: "include" });
      const d = await r.json();
      setUsers(Array.isArray(d) ? d : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [a, d] = await Promise.all([
        fetch(`${API}/admin/logs/attacks`,  { credentials: "include" }),
        fetch(`${API}/admin/logs/defenses`, { credentials: "include" }),
      ]);
      const [aData, dData] = await Promise.all([a.json(), d.json()]);
      setAttackLogs(Array.isArray(aData)  ? aData  : []);
      setDefenseLogs(Array.isArray(dData) ? dData  : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchScoring = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/scores/history`, { credentials: "include" });
      const d = await r.json();
      setScoreHistory(Array.isArray(d.history) ? d.history : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchComms = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/admin/announcements`, { credentials: "include" });
      const d = await r.json();
      setAnnouncements(Array.isArray(d) ? d : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const applyBonus = async () => {
    if (!selectedTeamId || !points || !reason) return showToast("Fill all fields", false);
    try {
      const r = await fetch(`${API}/admin/teams/${selectedTeamId}/bonus`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: Number(points), reason }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      showToast("Bonus applied");
      fetchScoring(); fetchTeams();
    } catch (e: any) { showToast(e.message, false); }
  };

  const applyPenalty = async () => {
    if (!selectedTeamId || !points || !reason) return showToast("Fill all fields", false);
    try {
      const r = await fetch(`${API}/admin/teams/${selectedTeamId}/penalty`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: Number(points), reason }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      showToast("Penalty applied");
      fetchScoring(); fetchTeams();
    } catch (e: any) { showToast(e.message, false); }
  };

  const createAnnouncement = async () => {
    if (!newTitle.trim() || !newMessage.trim()) return showToast("Title and message are required", false);
    setAnnouncementSubmitting(true);
    try {
      const r = await fetch(`${API}/admin/announcements`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), message: newMessage.trim(), type: newType }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      showToast("Announcement broadcast");
      setNewTitle(""); setNewMessage(""); setNewType("INFO");
      fetchComms();
    } catch (e: any) { showToast(e.message, false); }
    finally { setAnnouncementSubmitting(false); }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      const r = await fetch(`${API}/admin/announcements/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
      showToast("Announcement deleted");
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) { showToast(e.message, false); }
  };

  const togglePin = async (a: Announcement) => {
    try {
      const r = await fetch(`${API}/admin/announcements/${a.id}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !a.pinned }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      showToast(d.announcement.pinned ? "Pinned" : "Unpinned");
      setAnnouncements((prev) => prev.map((item) => (item.id === a.id ? d.announcement : item)));
    } catch (e: any) { showToast(e.message, false); }
  };

  const clearAllAnnouncements = async () => {
    if (!confirm("Clear ALL announcements? This cannot be undone.")) return;
    try {
      const r = await fetch(`${API}/admin/announcements`, { method: "DELETE", credentials: "include" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      showToast(d.message);
      setAnnouncements([]);
    } catch (e: any) { showToast(e.message, false); }
  };

  useEffect(() => {
    if (tab === "overview")  fetchDashboard();
    if (tab === "teams")     fetchTeams();
    if (tab === "users")     fetchUsers();
    if (tab === "logs")      fetchLogs();
    if (tab === "scoring")   { fetchScoring(); fetchTeams(); }
    if (tab === "comms")     fetchComms();
    if (tab === "matchups")  fetchTeams();   // matchups tab needs teams list
  }, [tab]);

  const NAV_ITEMS: { key: Tab; label: string }[] = [
    { key: "overview",  label: "overview"  },
    { key: "teams",     label: "teams"     },
    { key: "users",     label: "users"     },
    { key: "logs",      label: "logs"      },
    { key: "scoring",   label: "scoring"   },
    { key: "comms",     label: "comms"     },
    { key: "matchups",  label: "matchups"  },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 50% 0%, #111 0%, #050505 100%)",
      color: "#e2e2e2",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "2rem", right: "2rem", zIndex: 1000,
          background: "#111", borderLeft: `4px solid ${toast.ok ? "#22c55e" : "#ef4444"}`,
          padding: "1rem 1.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px",
          display: "flex", alignItems: "center", gap: "12px",
        }}>
          <span style={{ color: toast.ok ? "#22c55e" : "#ef4444" }}>{toast.ok ? "SUCCESS" : "ERROR"}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── HEADER ── */}
      <header style={{
        height: "64px", borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "0 2rem", display: "flex", alignItems: "center",
        justifyContent: "space-between", background: "rgba(5,5,5,0.8)",
        backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100,
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

      <div style={{ display: "flex", maxWidth: "1600px", margin: "0 auto" }}>
        {/* ── NAV ── */}
        <nav style={{
          width: "240px", padding: "2rem 1rem",
          display: "flex", flexDirection: "column", gap: "4px",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          minHeight: "calc(100vh - 64px)",
        }}>
          {NAV_ITEMS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                textAlign: "left", padding: "10px 16px",
                background: tab === key ? "rgba(255,255,255,0.05)" : "transparent",
                border: "none", borderRadius: "4px",
                color: tab === key ? "#fff" : "#666",
                fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px",
                textTransform: "uppercase", letterSpacing: "0.1em",
                cursor: "pointer", transition: "all 0.2s",
                display: "flex", alignItems: "center",
              }}
            >
              {tab === key && <span style={{ marginRight: "8px", color: key === "matchups" ? "#c084fc" : "#3b82f6" }}>&gt;</span>}
              {label}
              {/* Active matchup count badge in nav */}
              {key === "matchups" && tab !== "matchups" && (
                <span style={{
                  marginLeft: "auto",
                  fontSize: "9px", color: "#a855f7",
                  fontFamily: "'IBM Plex Mono', monospace",
                }}>
                  ◈
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, padding: "2.5rem" }}>

          {/* OVERVIEW */}
          {tab === "overview" && dashboard && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}>
                <StatCard label="Total Operatives" value={dashboard.stats.userCount}   accent="#3b82f6" />
                <StatCard label="Active Squads"     value={dashboard.stats.teamCount}   accent="#a855f7" />
                <StatCard label="Incursions"         value={dashboard.stats.attackCount}  accent="#ef4444" />
                <StatCard label="Neutralizations"    value={dashboard.stats.defenseCount} accent="#22c55e" />
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

          {/* TEAMS */}
          {tab === "teams" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <h2 style={{ fontSize: "24px", margin: "0 0 8px 0" }}>Tactical Units</h2>
                  <p style={{ color: "#666", fontSize: "13px" }}>Manage team rosters and manual score adjustments.</p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
                {teams.map(team => (
                  <div key={team.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "1.5rem" }}>
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
                      <GhostButton small onClick={() => setBonusModal({ teamId: team.id, teamName: team.name })} success>Bonus</GhostButton>
                      <GhostButton small onClick={() => {}} danger>Penalty</GhostButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* USERS */}
          {tab === "users" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <h2 style={{ fontSize: "24px", margin: 0 }}>Operatives</h2>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'IBM Plex Mono', monospace" }}>
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
                        <td style={{ padding: "1rem" }}>{u.teamMember?.team?.name || "—"}</td>
                        <td style={{ padding: "1rem", color: "#666" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LOGS */}
          {tab === "logs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <h2>Activity Logs</h2>
              <div>
                <h4 style={{ color: "#ef4444" }}>Attack Events</h4>
                {attackLogs.map(log => (
                  <div key={log.id} style={{ padding: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ color: log.success ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{log.success ? "SUCCESS" : "FAIL"}</span>
                        {" — "}<strong>{log.attacker.name}</strong>{" → "}<strong>{log.target.name}</strong>{" "}
                        <span style={{ color: "#666" }}>({log.type})</span>
                      </div>
                      <div style={{ fontSize: "10px", color: "#555" }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h4 style={{ color: "#3b82f6" }}>Defense Events</h4>
                {defenseLogs.map(log => (
                  <div key={log.id} style={{ padding: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ color: log.success ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{log.success ? "SUCCESS" : "FAIL"}</span>
                        {" — "}<strong>{log.team.name}</strong>{" "}
                        <span style={{ color: "#666" }}>({log.type})</span>
                      </div>
                      <div style={{ fontSize: "10px", color: "#555" }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCORING */}
          {tab === "scoring" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div style={{ padding: "1.5rem", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <h3 style={{ margin: 0 }}>Manual Score Control</h3>
                <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} style={{ padding: "10px", background: "#0a0a0a", border: "1px solid #222", color: "#fff" }}>
                  <option value="">Select Team</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name} ({t.role})</option>)}
                </select>
                <input type="number" placeholder="Points" value={points} onChange={(e) => setPoints(e.target.value)} style={{ padding: "10px", background: "#0a0a0a", border: "1px solid #222", color: "#fff" }} />
                <input type="text" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} style={{ padding: "10px", background: "#0a0a0a", border: "1px solid #222", color: "#fff" }} />
                <div style={{ display: "flex", gap: "10px" }}>
                  <GhostButton success onClick={applyBonus}>+ Bonus</GhostButton>
                  <GhostButton danger onClick={applyPenalty}>- Penalty</GhostButton>
                </div>
              </div>
              <h2>Score History</h2>
              {scoreHistory.map(s => (
                <div key={s.id} style={{ padding: "1rem", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Badge role={s.team?.role || "RED"} />
                        <strong>{s.team?.name}</strong>
                      </div>
                      <div style={{ fontSize: "12px", color: "#888" }}>{s.reason}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: s.delta > 0 ? "#22c55e" : "#ef4444" }}>
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

          {/* COMMS */}
          {tab === "comms" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <h2 style={{ fontSize: "24px", margin: "0 0 6px 0" }}>Broadcast Channel</h2>
                  <p style={{ color: "#666", fontSize: "13px", margin: 0 }}>
                    {announcements.length} active announcement{announcements.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {announcements.length > 0 && (
                  <GhostButton danger onClick={clearAllAnnouncements}>Clear All</GhostButton>
                )}
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3b82f6" }} />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#888" }}>New Announcement</span>
                </div>
                <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={labelStyle}>Type</label>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {(["INFO", "WARNING", "ALERT", "SUCCESS"] as AnnouncementType[]).map((t) => {
                        const cfg = TYPE_CONFIG[t];
                        const active = newType === t;
                        return (
                          <button key={t} onClick={() => setNewType(t)} style={{
                            padding: "6px 14px", fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                            textTransform: "uppercase", cursor: "pointer", borderRadius: "2px",
                            border: `1px solid ${active ? cfg.color : "rgba(255,255,255,0.08)"}`,
                            background: active ? cfg.bg : "transparent",
                            color: active ? cfg.color : "#555", transition: "all 0.15s",
                          }}>{cfg.label}</button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Title</label>
                    <input type="text" placeholder="e.g. Round 2 Starting in 5 Minutes" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} maxLength={120}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = TYPE_CONFIG[newType].color)}
                      onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Message</label>
                    <textarea placeholder="Broadcast message visible to all participants..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={4}
                      style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 } as React.CSSProperties}
                      onFocus={(e) => (e.target.style.borderColor = TYPE_CONFIG[newType].color)}
                      onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "3px 8px", borderRadius: "2px", background: TYPE_CONFIG[newType].bg, color: TYPE_CONFIG[newType].color, border: `1px solid ${TYPE_CONFIG[newType].color}44`, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.08em" }}>
                        {newType}
                      </span>
                      {newTitle && <span style={{ fontSize: "12px", color: "#666", fontStyle: "italic" }}>"{newTitle.slice(0, 40)}{newTitle.length > 40 ? "…" : ""}"</span>}
                    </div>
                    <button onClick={createAnnouncement} disabled={announcementSubmitting || !newTitle.trim() || !newMessage.trim()}
                      style={{ padding: "10px 24px", background: (!newTitle.trim() || !newMessage.trim() || announcementSubmitting) ? "transparent" : TYPE_CONFIG[newType].bg, border: `1px solid ${TYPE_CONFIG[newType].color}`, borderRadius: "4px", color: TYPE_CONFIG[newType].color, fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", cursor: (!newTitle.trim() || !newMessage.trim() || announcementSubmitting) ? "not-allowed" : "pointer", opacity: (!newTitle.trim() || !newMessage.trim()) ? 0.35 : 1, transition: "all 0.2s" }}>
                      {announcementSubmitting ? "Broadcasting..." : "⬆ Broadcast"}
                    </button>
                  </div>
                </div>
              </div>

              {announcements.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "#333", fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", border: "1px dashed rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                  NO ACTIVE ANNOUNCEMENTS
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[...announcements].sort((a, b) => {
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  }).map((a) => {
                    const cfg = TYPE_CONFIG[a.type];
                    return (
                      <div key={a.id} style={{ padding: "1rem 1.25rem", borderLeft: `3px solid ${cfg.color}`, background: a.pinned ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)", border: `1px solid rgba(255,255,255,0.05)`, borderLeftWidth: "3px", borderLeftColor: cfg.color, borderRadius: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                              <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "2px", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44`, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.06em" }}>{a.type}</span>
                              {a.pinned && <span style={{ fontSize: "9px", color: "#f59e0b", fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.05em" }}>📌 PINNED</span>}
                              <strong style={{ fontSize: "14px" }}>{a.title}</strong>
                            </div>
                            <p style={{ margin: "0 0 8px 0", color: "#aaa", fontSize: "13px", lineHeight: 1.5 }}>{a.message}</p>
                            <span style={{ fontSize: "10px", color: "#444", fontFamily: "'IBM Plex Mono', monospace" }}>{new Date(a.createdAt).toLocaleString()}</span>
                          </div>
                          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                            <GhostButton small onClick={() => togglePin(a)}>{a.pinned ? "Unpin" : "Pin"}</GhostButton>
                            <GhostButton small danger onClick={() => deleteAnnouncement(a.id)}>Delete</GhostButton>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── MATCHUPS ── */}
          {tab === "matchups" && (
            <MatchupsTab teams={teams} showToast={showToast} />
          )}

        </main>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600;700&family=Inter:wght@300;400;600;800&display=swap');
        body { margin: 0; padding: 0; overflow-x: hidden; }
        .spinner {
          width: 12px; height: 12px;
          border: 2px solid rgba(59,130,246,0.2);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #333; }
      `}</style>
    </div>
  );
}