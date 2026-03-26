"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type AnnouncementType = "INFO" | "WARNING" | "ALERT" | "SUCCESS";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  pinned: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<
  AnnouncementType,
  { color: string; bg: string; border: string; bar: string; icon: string }
> = {
  INFO: {
    color: "#aaaaaa",
    bg: "#080808",
    border: "#1e1e1e",
    bar: "#555555",
    icon: "ℹ",
  },
  WARNING: {
    color: "#ffaa00",
    bg: "#0e0900",
    border: "#2a1f00",
    bar: "#ffaa00",
    icon: "⚠",
  },
  ALERT: {
    color: "#ff4444",
    bg: "#0e0404",
    border: "#2a0808",
    bar: "#ff4444",
    icon: "!",
  },
  SUCCESS: {
    color: "#44ff88",
    bg: "#040e09",
    border: "#082a14",
    bar: "#44ff88",
    icon: "✓",
  },
};

interface BannerItemProps {
  ann: Announcement;
  onDismiss: (id: string) => void;
  isNew: boolean;
}

function BannerItem({ ann, onDismiss, isNew }: BannerItemProps) {
  const cfg = TYPE_CONFIG[ann.type];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay so the slide-in animation fires after mount
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(ann.id), 300);
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "12px 16px",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderLeft: `3px solid ${cfg.bar}`,
        position: "relative",
        overflow: "hidden",
        transform: visible ? "translateY(0)" : "translateY(-12px)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.3s ease, opacity 0.3s ease",
        maxWidth: "560px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Pulse dot for new announcements */}
      {isNew && (
        <span
          style={{
            position: "absolute",
            top: "10px",
            right: "36px",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: cfg.bar,
            animation: "pulse 1.5s ease infinite",
          }}
        />
      )}

      {/* Icon */}
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "13px",
          color: cfg.color,
          flexShrink: 0,
          marginTop: "1px",
          fontWeight: 700,
        }}
      >
        {cfg.icon}
      </span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "3px",
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "9px",
              letterSpacing: "0.15em",
              color: cfg.color,
              textTransform: "uppercase",
            }}
          >
            {ann.type}
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "9px",
              color: "#333333",
            }}
          >
            {new Date(ann.createdAt).toLocaleTimeString("en-US", {
              hour12: false,
            })}
          </span>
        </div>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "12px",
            fontWeight: 600,
            color: "#ffffff",
            margin: "0 0 3px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {ann.title}
        </p>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: "12px",
            color: "#888888",
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          {ann.message}
        </p>
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        style={{
          background: "none",
          border: "none",
          color: "#333333",
          fontSize: "14px",
          cursor: "pointer",
          padding: "0",
          flexShrink: 0,
          lineHeight: 1,
          marginTop: "1px",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#333333")}
      >
        ×
      </button>
    </div>
  );
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [socket, setSocket] = useState<Socket | null>(null);

  // Load existing announcements on mount
  useEffect(() => {
    fetch(`http://localhost:5000/api/admin/announcements`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data: Announcement[]) => {
        if (Array.isArray(data)) {
          // Show pinned ones and the 3 most recent
          const pinned = data.filter((a) => a.pinned);
          const recent = data.filter((a) => !a.pinned).slice(0, 3);
          setAnnouncements([...pinned, ...recent]);
        }
      })
      .catch(() => {});
  }, []);

  // Connect to Socket.io and listen for new announcements
  useEffect(() => {
    const s = io(API, { withCredentials: true });
    setSocket(s);

    s.on("new_announcement", (ann: Announcement) => {
      setAnnouncements((prev) => {
        // Avoid duplicates
        if (prev.find((a) => a.id === ann.id)) return prev;
        return [ann, ...prev];
      });
      setNewIds((prev) => new Set(prev).add(ann.id));
      // Remove "new" highlight after 5s
      setTimeout(() => {
        setNewIds((prev) => {
          const next = new Set(prev);
          next.delete(ann.id);
          return next;
        });
      }, 5000);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  const dismiss = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  if (announcements.length === 0) return null;

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500&display=swap"
      />
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
      `}</style>

      <div
        style={{
          width: "100%",
          background: "#000000",
          borderBottom: "1px solid #111111",
          padding: "8px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          zIndex: 200,
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "9px",
              letterSpacing: "0.2em",
              color: "#333333",
              textTransform: "uppercase",
            }}
          >
            ● TRANSMISSIONS
          </span>
          {announcements.length > 1 && (
            <button
              onClick={() => setAnnouncements([])}
              style={{
                background: "none",
                border: "none",
                color: "#333333",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "9px",
                letterSpacing: "0.1em",
                cursor: "pointer",
                padding: 0,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#333333")}
            >
              DISMISS ALL
            </button>
          )}
        </div>

        {/* Banner items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {announcements.map((ann) => (
            <BannerItem
              key={ann.id}
              ann={ann}
              onDismiss={dismiss}
              isNew={newIds.has(ann.id)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
