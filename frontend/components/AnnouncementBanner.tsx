"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { io, Socket } from "socket.io-client";

const API = "http://localhost:5000";

type AnnouncementType = "INFO" | "WARNING" | "ALERT" | "SUCCESS";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  pinned: boolean;
  createdAt: string;
}

const THEME = {
  INFO: { border: "#00ccff", bg: "rgba(0, 50, 80, 0.9)", glow: "rgba(0, 204, 255, 0.4)" },
  WARNING: { border: "#ffcc00", bg: "rgba(60, 50, 0, 0.9)", glow: "rgba(255, 204, 0, 0.4)" },
  ALERT: { border: "#ff2244", bg: "rgba(80, 0, 20, 0.9)", glow: "rgba(255, 34, 68, 0.4)" },
  SUCCESS: { border: "#00ff88", bg: "rgba(0, 60, 30, 0.9)", glow: "rgba(0, 255, 136, 0.4)" },
};

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set()); // Track closed items
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const socket: Socket = io(API, { withCredentials: true, transports: ["websocket"] });

    socket.on("new_announcement", (ann: Announcement) => {
      setAnnouncements((prev) => (prev.find((a) => a.id === ann.id) ? prev : [ann, ...prev]));
    });

    socket.on("delete_announcement", ({ id }: { id: string }) => {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    });

    socket.on("clear_all_announcements", () => setAnnouncements([]));

    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    fetch(`${API}/announcement`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: Announcement[]) => {
        if (!Array.isArray(data)) return;
        const pinned = data.filter((a) => a.pinned);
        const recent = data.filter((a) => !a.pinned).slice(0, 3);
        setAnnouncements([...pinned, ...recent]);
      })
      .catch(console.error);
  }, []);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  if (!mounted) return null;

  // Filter out announcements that have been dismissed in the current session
  const visibleAnnouncements = announcements.filter(ann => !dismissedIds.has(ann.id));

  return createPortal(
    <div
      style={{
        position: "fixed",
        bottom: "32px",
        left: "32px",
        width: "340px",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column-reverse",
        gap: "12px",
        pointerEvents: "none",
      }}
    >
      {visibleAnnouncements.map((ann) => {
        const style = THEME[ann.type] || THEME.INFO;

        return (
          <div
            key={ann.id}
            className="ann-card"
            style={{
              pointerEvents: "auto",
              background: style.bg,
              border: `1px solid ${style.border}`,
              borderLeft: `4px solid ${style.border}`,
              padding: "14px",
              boxShadow: `0 0 15px ${style.glow}`,
              position: "relative",
              overflow: "hidden",
              fontFamily: "'Share Tech Mono', monospace",
              clipPath: "polygon(0% 0%, 100% 0%, 100% 85%, 95% 100%, 0% 100%)",
            }}
          >
            <div className="scanline-overlay" />

            {/* Close Button */}
            <button
              onClick={() => handleDismiss(ann.id)}
              className="close-btn"
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                fontSize: "16px",
                lineHeight: "1",
                padding: "4px",
                zIndex: 10,
                transition: "color 0.2s"
              }}
            >
              ✕
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "20px" }}>
              <span style={{ color: style.border, fontSize: "10px", fontWeight: "bold", letterSpacing: "2px" }}>
                SYSTEM_{ann.type} // {ann.pinned ? "PINNED" : "BROADCAST"}
              </span>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "9px" }}>
                {new Date(ann.createdAt).toLocaleTimeString()}
              </span>
            </div>

            <div style={{ color: "#fff", fontSize: "15px", marginTop: "6px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>
              {ann.title}
            </div>

            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", marginTop: "4px", lineHeight: "1.4" }}>
              &gt; {ann.message}
            </div>
            
            <div style={{ position: "absolute", bottom: 0, right: 0, width: "10px", height: "10px", background: style.border }} />
          </div>
        );
      })}
      
      <style jsx>{`
        .ann-card {
          animation: slideIn 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        }
        .close-btn:hover {
          color: white !important;
          text-shadow: 0 0 8px white;
        }
        .scanline-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.1) 50%);
          background-size: 100% 4px;
          pointer-events: none;
          opacity: 0.3;
        }
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
}