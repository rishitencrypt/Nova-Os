import { useState, useEffect, useRef } from "react";

// ── Ellipse math helpers ──────────────────────────────────────────────────────
// The orbit is a tilted ellipse drawn in SVG space.
// We define it by its center (cx, cy), semi-axes (rx, ry), and tilt angle φ.
// A point at parameter t (0…2π) on the ellipse:
//   x = cx + rx·cos(t)·cos(φ) − ry·sin(t)·sin(φ)
//   y = cy + rx·cos(t)·sin(φ) + ry·sin(t)·cos(φ)

const SVG_W = 900;
const SVG_H = 520;
const CX = SVG_W / 2;
const CY = SVG_H / 2;
const RX = 230;
const RY = 72;
const TILT = -18 * (Math.PI / 180); // degrees → radians

function ellipsePoint(t) {
  const cosT = Math.cos(t);
  const sinT = Math.sin(t);
  const cosF = Math.cos(TILT);
  const sinF = Math.sin(TILT);
  return {
    x: CX + RX * cosT * cosF - RY * sinT * sinF,
    y: CY + RX * cosT * sinF + RY * sinT * cosF,
  };
}

// Build a full SVG ellipse path string (360 points for smooth arc)
function buildEllipsePath(segments = 360) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * 2 * Math.PI;
    const { x, y } = ellipsePoint(t);
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(3)},${y.toFixed(3)}`);
  }
  return pts.join(" ") + " Z";
}

// Build a partial arc path from t=0 to t=fraction*(2π)
function buildArcPath(fraction, segments = 360) {
  if (fraction <= 0) return "";
  const count = Math.max(2, Math.round(fraction * segments));
  const pts = [];
  for (let i = 0; i <= count; i++) {
    const t = (i / segments) * 2 * Math.PI;
    const { x, y } = ellipsePoint(t);
    pts.push(`${i === 0 ? "M" : "L"}${x.toFixed(3)},${y.toFixed(3)}`);
  }
  return pts.join(" ");
}

// Parameter t where y is at maximum (planet "behind" logo — far side of orbit)
// Far side: t = π  (opposite to t = 0 which is the "near" rightmost point)
// Planet is "in front" when y > CY (lower half in SVG) and "behind" when y < CY (upper half)
// With our tilt, let's check: at t=π, y = CY + RX·cos(π)·sin(φ) + RY·sin(π)·cos(φ) = CY − RX·sin(φ)
// sin(-18°) ≈ -0.309, so y ≈ CY + 0.309*RX ≈ CY + 71 → that's BELOW center → "front"
// At t=0: y = CY + RX·sin(φ) ≈ CY - 71 → above center → "back"
// So planet is BEHIND logo when y < CY (i.e., upper arc, t ∈ (0, π) approximately)
// We'll use y position to determine z-order.

// ── Stars ─────────────────────────────────────────────────────────────────────
function generateStars(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    r: Math.random() * 1.4 + 0.3,
    opacity: Math.random() * 0.6 + 0.2,
    delay: Math.random() * 4,
    duration: Math.random() * 3 + 2,
    bright: Math.random() > 0.85,
  }));
}

const STARS = generateStars(320);

// ── Status messages ───────────────────────────────────────────────────────────
const STATUS_MSGS = [
  "Initializing Navigation Core...",
  "Connecting Deep Space Network...",
  "Loading Star Maps...",
  "Quantum Core Online...",
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function NovaOS() {
  const [progress, setProgress] = useState(0); // 0 → 1
  const [statusIdx, setStatusIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const DURATION = 8000; // ms for full revolution

  // Animate progress
  useEffect(() => {
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const p = Math.min(elapsed / DURATION, 1);
      setProgress(p);

      // cycle status messages
      const msgIdx = Math.min(
        Math.floor(p * STATUS_MSGS.length),
        STATUS_MSGS.length - 1
      );
      setStatusIdx(msgIdx);

      if (p < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          setDone(true);
          setTimeout(() => setBootDone(true), 1200);
        }, 400);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const t = progress * 2 * Math.PI;
  const planet = ellipsePoint(t);
  const isBehind = planet.y < CY; // planet above center → behind logo

  const FULL_PATH = buildEllipsePath();
  const ARC_PATH = buildArcPath(progress);

  // Planet glow layers
  const PLANET_R = 9;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "radial-gradient(ellipse at 40% 50%, #0a0e2a 0%, #04060f 55%, #000208 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
        opacity: bootDone ? 0 : 1,
        transition: "opacity 1.2s ease",
      }}
    >
      {/* ── Nebula glows ── */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `
          radial-gradient(ellipse 60% 40% at 30% 60%, rgba(20,60,120,0.18) 0%, transparent 70%),
          radial-gradient(ellipse 50% 35% at 75% 35%, rgba(40,20,100,0.14) 0%, transparent 65%),
          radial-gradient(ellipse 40% 30% at 55% 80%, rgba(10,30,80,0.10) 0%, transparent 60%)
        `
      }} />

      {/* ── Stars ── */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <style>{`
            @keyframes twinkle {
              0%,100% { opacity: var(--base-op); }
              50% { opacity: calc(var(--base-op) * 0.15); }
            }
            @keyframes twinkleBright {
              0%,100% { opacity: var(--base-op); r: var(--base-r); }
              50% { opacity: calc(var(--base-op) * 0.3); r: calc(var(--base-r) * 0.6); }
            }
          `}</style>
        </defs>
        {STARS.map((s) => (
          <circle
            key={s.id}
            cx={s.x}
            cy={s.y}
            r={s.r * 0.12}
            fill={s.bright ? "#b8d8ff" : "#e8f0ff"}
            style={{
              "--base-op": s.opacity,
              "--base-r": `${s.r * 0.12}px`,
              animation: `${s.bright ? "twinkleBright" : "twinkle"} ${s.duration}s ${s.delay}s ease-in-out infinite`,
              opacity: s.opacity,
            }}
          />
        ))}
      </svg>

      {/* ── Main SVG scene ── */}
      <div style={{ position: "relative", width: SVG_W, height: SVG_H }}>
        <svg
          width={SVG_W}
          height={SVG_H}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* Orbit glow filter */}
            <filter id="orbitGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur1" />
              <feGaussianBlur stdDeviation="7" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Planet glow */}
            <filter id="planetGlow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Logo glow */}
            <filter id="logoGlow" x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation="12" result="b1" />
              <feGaussianBlur stdDeviation="24" result="b2" />
              <feMerge>
                <feMergeNode in="b2" />
                <feMergeNode in="b1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Planet radial gradient */}
            <radialGradient id="planetGrad" cx="38%" cy="32%" r="65%">
              <stop offset="0%" stopColor="#a8d8ff" />
              <stop offset="40%" stopColor="#3a9eff" />
              <stop offset="100%" stopColor="#0040a0" />
            </radialGradient>
            {/* Arc progress gradient */}
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1a6fff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#60c8ff" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* ── Far-side planet (behind logo) ── */}
          {isBehind && (
            <g filter="url(#planetGlow)">
              <circle cx={planet.x} cy={planet.y} r={PLANET_R * 2.8} fill="#2060ff" opacity={0.12} />
              <circle cx={planet.x} cy={planet.y} r={PLANET_R * 1.6} fill="#3080ff" opacity={0.25} />
              <circle cx={planet.x} cy={planet.y} r={PLANET_R} fill="url(#planetGrad)" />
              <circle cx={planet.x - 2.5} cy={planet.y - 2.5} r={PLANET_R * 0.35} fill="rgba(200,235,255,0.55)" />
            </g>
          )}

          {/* ── Dim full orbit (background track) ── */}
          <path
            d={FULL_PATH}
            fill="none"
            stroke="rgba(60,120,255,0.18)"
            strokeWidth="1.5"
          />

          {/* ── Progress arc (filled portion) ── */}
          {ARC_PATH && (
            <path
              d={ARC_PATH}
              fill="none"
              stroke="url(#arcGrad)"
              strokeWidth="2.2"
              strokeLinecap="round"
              filter="url(#orbitGlow)"
              opacity={0.92}
            />
          )}

          {/* ── NOVA OS Logo (always on top of far-side planet) ── */}
          <g filter="url(#logoGlow)">
            {/* Outer halo */}
            <text
              x={CX}
              y={CY + 14}
              textAnchor="middle"
              fill="rgba(80,160,255,0.15)"
              fontSize="78"
              fontWeight="700"
              letterSpacing="18"
              style={{ userSelect: "none", fontFamily: "'SF Pro Display','Inter',system-ui,sans-serif" }}
            >
              NOVA OS
            </text>
            {/* Main text */}
            <text
              x={CX}
              y={CY + 14}
              textAnchor="middle"
              fill="#d8eeff"
              fontSize="78"
              fontWeight="700"
              letterSpacing="18"
              style={{ userSelect: "none", fontFamily: "'SF Pro Display','Inter',system-ui,sans-serif" }}
            >
              NOVA OS
            </text>
            {/* Subtle inner highlight */}
            <text
              x={CX}
              y={CY + 14}
              textAnchor="middle"
              fill="url(#logoHighlight)"
              fontSize="78"
              fontWeight="700"
              letterSpacing="18"
              opacity={0.35}
              style={{ userSelect: "none", fontFamily: "'SF Pro Display','Inter',system-ui,sans-serif" }}
            >
              NOVA OS
            </text>
          </g>

          {/* ── Near-side planet (in front of logo) ── */}
          {!isBehind && (
            <g filter="url(#planetGlow)">
              <circle cx={planet.x} cy={planet.y} r={PLANET_R * 3.2} fill="#1040c0" opacity={0.10} />
              <circle cx={planet.x} cy={planet.y} r={PLANET_R * 1.8} fill="#2060ff" opacity={0.20} />
              <circle cx={planet.x} cy={planet.y} r={PLANET_R} fill="url(#planetGrad)" />
              <circle cx={planet.x - 2.5} cy={planet.y - 2.5} r={PLANET_R * 0.35} fill="rgba(220,245,255,0.65)" />
            </g>
          )}
        </svg>

        {/* ── Status text ── */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: 0,
            right: 0,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          {/* % counter */}
          <div style={{
            fontSize: 11,
            letterSpacing: "0.25em",
            color: "rgba(120,180,255,0.5)",
            marginBottom: 10,
            fontWeight: 500,
          }}>
            {Math.round(progress * 100)}%
          </div>
          {/* Status message */}
          <div
            key={statusIdx}
            style={{
              fontSize: 13,
              letterSpacing: "0.18em",
              color: "rgba(160,210,255,0.7)",
              fontWeight: 400,
              animation: "fadeStatus 0.5s ease",
            }}
          >
            {STATUS_MSGS[statusIdx]}
          </div>
        </div>
      </div>

      {/* ── Bottom version line ── */}
      <div style={{
        position: "absolute",
        bottom: 28,
        width: "100%",
        textAlign: "center",
        fontSize: 10,
        letterSpacing: "0.3em",
        color: "rgba(80,120,200,0.35)",
        fontWeight: 400,
        pointerEvents: "none",
      }}>
        NOVA OS v4.1.0 · DEEP SPACE EDITION
      </div>

      {/* ── Done flash ── */}
      {done && (
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at center, rgba(30,80,200,0.18) 0%, transparent 70%)",
          animation: "flashIn 1.2s ease forwards",
          pointerEvents: "none",
        }} />
      )}

      <style>{`
        @keyframes fadeStatus {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes flashIn {
          0%   { opacity: 0; }
          30%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}