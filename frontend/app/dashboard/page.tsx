"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "BLUE" | "RED";

export default function Dashboard() {
  const router = useRouter();
  const cursorRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [joining, setJoining] = useState<Role | null>(null);
  const [hovered, setHovered] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* custom cursor */
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!cursorRef.current) return;
      cursorRef.current.style.left = `${e.clientX}px`;
      cursorRef.current.style.top = `${e.clientY}px`;
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  if (!mounted) return null;

  const handleJoin = (role: Role) => {
    router.push(`/dashboard/select-team/${role.toLowerCase()}`);
  };

  const blueExpanded = hovered === "BLUE";
  const redExpanded = hovered === "RED";

  return (
    <>
      <style suppressHydrationWarning>{`

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .arena-wrap {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background: #080808;
          cursor: none;
          font-family: 'Azeret Mono', monospace;
          position: relative;
        }

        /* ── custom cursor ── */
        .arena-cursor {
          position: fixed;
          width: 10px; height: 10px;
          border: 1.5px solid #fff;
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          transform: translate(-50%, -50%);
          mix-blend-mode: difference;
          transition: transform 0.15s;
        }

        /* ── divider ── */
        .arena-divider {
          position: absolute;
          left: 50%; top: 0;
          width: 1.5px; height: 100%;
          background: #fff;
          z-index: 20;
          transform: translateX(-50%);
        }

        .arena-vs {
          position: absolute;
          left: 50%; top: 50%;
          transform: translate(-50%, -50%);
          z-index: 30;
          background: #080808;
          border: 1.5px solid #fff;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 24px;
          letter-spacing: 5px;
          color: #fff;
          padding: 10px 14px;
          line-height: 1;
        }

        /* ── sides ── */
        .arena-side {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          border: none;
          cursor: none;
          transition: flex 0.45s cubic-bezier(0.22, 1, 0.36, 1),
                      background 0.3s;
        }

        .arena-side.blue { background: #030d1f; }
        .arena-side.red  { background: #1a0303; }

        .arena-side.blue.expanded { flex: 1.18; }
        .arena-side.red.expanded  { flex: 1.18; }

        /* grid texture */
        .arena-side::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* ghost watermark */
        .arena-side::after {
          content: attr(data-label);
          position: absolute;
          bottom: -24px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: min(22vw, 200px);
          letter-spacing: -4px;
          line-height: 1;
          pointer-events: none;
          white-space: nowrap;
          transition: opacity 0.3s;
        }
        .arena-side.blue::after { left: -16px;  color: rgba(30,100,255,0.07); }
        .arena-side.red::after  { right: -16px; color: rgba(220,30,30,0.07); }
        .arena-side.expanded::after { opacity: 1.5; }

        /* ── glow blob ── */
        .glow {
          position: absolute;
          width: 60%; aspect-ratio: 1;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.4s;
          filter: blur(80px);
        }
        .arena-side.blue .glow { background: #1466ff; left: 10%; top: 20%; }
        .arena-side.red  .glow { background: #cc2200; right: 10%; top: 20%; }
        .arena-side.expanded .glow { opacity: 0.22; }

        /* ── content ── */
        .side-content {
          position: relative;
          z-index: 5;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          text-align: center;
          padding: 0 40px;
        }

        .side-icon {
          font-size: 56px;
          line-height: 1;
          transition: transform 0.3s;
        }
        .arena-side.expanded .side-icon { transform: scale(1.15); }

        .side-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(56px, 8vw, 110px);
          letter-spacing: 10px;
          line-height: 0.9;
          transition: letter-spacing 0.35s;
        }
        .arena-side.expanded .side-title { letter-spacing: 14px; }
        .arena-side.blue .side-title {
          color: #5ba8ff;
        }
        .arena-side.red  .side-title {
          color: #ff5555;
        }

        .side-desc {
          font-size: 10px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.38);
          max-width: 220px;
          line-height: 2;
        }

        .join-btn {
          margin-top: 4px;
          padding: 13px 44px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 20px;
          letter-spacing: 7px;
          border: none;
          cursor: none;
          color: #fff;
          position: relative;
          clip-path: polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%);
          transition: transform 0.2s, opacity 0.2s;
        }
        .join-btn:disabled { opacity: 0.45; }
        .arena-side.blue .join-btn { background: #1a5fff; }
        .arena-side.red  .join-btn { background: #e01c1c; }
        .arena-side.expanded .join-btn:not(:disabled) { transform: scale(1.06) translateY(-2px); }

        /* scan line */
        .scan {
          position: absolute;
          width: 100%; height: 1.5px;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
          animation: scan 5s linear infinite;
          pointer-events: none;
          z-index: 1;
        }
        .arena-side.red .scan { animation-delay: -2.5s; }
        @keyframes scan { from { top: -2px; } to { top: 100%; } }

        /* status */
        .status {
          position: absolute;
          bottom: 20px;
          font-size: 9px;
          letter-spacing: 3px;
          color: rgba(255,255,255,0.2);
          text-transform: uppercase;
          z-index: 5;
        }
        .blink { animation: blink 1.4s step-end infinite; }
        @keyframes blink { 50% { opacity: 0; } }

        /* error toast */
        .err-toast {
          position: fixed;
          bottom: 28px; left: 50%;
          transform: translateX(-50%);
          background: #1a0404;
          border: 1px solid #cc2222;
          color: #ff5555;
          padding: 10px 24px;
          font-size: 11px;
          letter-spacing: 2px;
          z-index: 100;
          font-family: 'Azeret Mono', monospace;
          white-space: nowrap;
        }
      `}</style>

      <div ref={cursorRef} className="arena-cursor" />

      <div className="arena-wrap">
        {/* <div className="arena-divider" /> */}
        {/* <div className="arena-vs">VS</div> */}

        {/* ── BLUE — DEFENCE ── */}
        <button
          className={`arena-side blue${blueExpanded ? " expanded" : ""}`}
          data-label="DEFENCE"
          onClick={() => handleJoin("BLUE")}
          onMouseEnter={() => setHovered("BLUE")}
          onMouseLeave={() => setHovered(null)}
          disabled={!!joining}
          aria-label="Join Blue team – Defence"
        >
          <div className="glow" />
          <div className="scan" />
          <div className="side-content">
            <span className="side-icon">🛡</span>
            <div className="side-title">DEFENCE</div>
            <p className="side-desc">
              Protect the infrastructure.
              <br />
              Detect and neutralise threats.
            </p>
            <button className="join-btn" tabIndex={-1} disabled={!!joining}>
              {joining === "BLUE" ? "JOINING…" : "JOIN BLUE"}
            </button>
          </div>
          <div className="status">
            <span className="blink">▮</span>&nbsp;TEAM BLUE ONLINE
          </div>
        </button>

        {/* ── RED — ATTACK ── */}
        <button
          className={`arena-side red${redExpanded ? " expanded" : ""}`}
          data-label="ATTACK"
          onClick={() => handleJoin("RED")}
          onMouseEnter={() => setHovered("RED")}
          onMouseLeave={() => setHovered(null)}
          disabled={!!joining}
          aria-label="Join Red team – Attack"
        >
          <div className="glow" />
          <div className="scan" />
          <div className="side-content">
            <span className="side-icon">⚔</span>
            <div className="side-title">ATTACK</div>
            <p className="side-desc">
              Breach the perimeter.
              <br />
              Find the weakness. Strike fast.
            </p>
            <button className="join-btn" tabIndex={-1} disabled={!!joining}>
              {joining === "RED" ? "JOINING…" : "JOIN RED"}
            </button>
          </div>
          <div className="status">
            TEAM RED ONLINE&nbsp;<span className="blink">▮</span>
          </div>
        </button>
      </div>

      {error && <div className="err-toast">⚠ {error.toUpperCase()}</div>}
    </>
  );
}
