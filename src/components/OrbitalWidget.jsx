import { useState, useEffect, useRef } from "react";

const ACCENT = "#6366F1";
const GREEN = "#22C55E";
const RED = "#EF4444";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const createContacts = () => {
  const count = 3 + Math.floor(Math.random() * 4);
  return Array.from({ length: count }, () => ({
    angle: Math.random() * Math.PI * 2,
    radius: 0.25 + Math.random() * 0.7,
    hostile: Math.random() < 0.18,
    size: 1.8 + Math.random() * 1.6,
  }));
};

export default function OrbitalWidget() {
  const [now, setNow] = useState(new Date());
  const [signal, setSignal] = useState(99);
  const [contacts, setContacts] = useState(() => createContacts());
  const sweepRef = useRef(0);
  const canvasRef = useRef(null);

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Signal flicker
  useEffect(() => {
    const id = setInterval(() => {
      setSignal((s) => {
        const next = s + (Math.random() * 4 - 2);
        return Math.max(94, Math.min(100, Math.round(next)));
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);

  // Generate / refresh sensor contacts
  useEffect(() => {
    const make = () => {
      const count = 3 + Math.floor(Math.random() * 4);
      return Array.from({ length: count }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: 0.25 + Math.random() * 0.7,
        hostile: Math.random() < 0.18,
        size: 1.8 + Math.random() * 1.6,
      }));
    };
    const id = setInterval(() => setContacts(make()), 4000);
    return () => clearInterval(id);
  }, []);

  // Radar render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const size = 168;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size / 2 - 6;
    let raf;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // Base disc
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, maxR);
      grad.addColorStop(0, "rgba(79,70,229,0.10)");
      grad.addColorStop(1, "rgba(15,18,24,0.0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      ctx.fill();

      // Orbit rings
      ctx.strokeStyle = "rgba(148,163,184,0.18)";
      ctx.lineWidth = 1;
      [0.35, 0.62, 0.88, 1].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Cross hairs
      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy);
      ctx.lineTo(cx + maxR, cy);
      ctx.moveTo(cx, cy - maxR);
      ctx.lineTo(cx, cy + maxR);
      ctx.stroke();

      // Sweep
      sweepRef.current = (sweepRef.current + 0.02) % (Math.PI * 2);
      const a = sweepRef.current;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, a - 0.5, a);
      ctx.closePath();
      const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      sg.addColorStop(0, "rgba(79,70,229,0.45)");
      sg.addColorStop(1, "rgba(79,70,229,0)");
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.restore();

      // Sweep leading line
      ctx.strokeStyle = "rgba(99,102,241,0.85)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
      ctx.stroke();

      // Contacts (light up when sweep passes)
      contacts.forEach((c) => {
        const x = cx + Math.cos(c.angle) * maxR * c.radius;
        const y = cy + Math.sin(c.angle) * maxR * c.radius;
        let diff = Math.abs(((a - c.angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2));
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        const glow = Math.max(0.25, 1 - diff / 0.9);
        const color = c.hostile ? RED : GREEN;
        ctx.fillStyle = color;
        ctx.globalAlpha = glow;
        ctx.beginPath();
        ctx.arc(x, y, c.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = glow * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, c.size * 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Center node
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [contacts]);

  const hostiles = contacts.filter((c) => c.hostile).length;
  const status = hostiles > 0 ? "ALERT" : "STABLE";
  const statusColor = hostiles > 0 ? RED : GREEN;

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const dateStr = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.dot} />
        <span style={styles.title}>TACTICAL SENSOR ARRAY</span>
      </div>

      <div style={styles.radarBox}>
        <canvas ref={canvasRef} />
        <span style={styles.cornerTL} />
        <span style={styles.cornerTR} />
        <span style={styles.cornerBL} />
        <span style={styles.cornerBR} />
      </div>

      <div style={styles.divider} />

      <div style={styles.footer}>
        <div style={styles.timeRow}>
          <span style={styles.time}>{hh}:{mm}</span>
          <span style={styles.date}>{dateStr}</span>
        </div>

        <div style={styles.metricRow}>
          <span style={styles.label}>SIGNAL</span>
          <span style={{ ...styles.value, color: signal >= 97 ? GREEN : ACCENT }}>
            {signal}%
          </span>
        </div>
        <div style={styles.metricRow}>
          <span style={styles.label}>STATUS</span>
          <span style={{ ...styles.value, color: statusColor }}>{status}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
 wrapper: {
  position: "fixed",
  top: 20,
  right: 20,
  zIndex: 1,

  width: 300,
  height: 380,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    padding: "12px 14px",
    borderRadius: 14,
    background:
  "linear-gradient(135deg, rgba(30,41,59,0.35), rgba(15,23,42,0.55))",

border: "1px solid rgba(255,255,255,0.15)",

boxShadow:
  `
  0 8px 32px rgba(0,0,0,0.35),
  inset 0 1px 0 rgba(255,255,255,0.20),
  inset 0 -1px 0 rgba(255,255,255,0.05)
  `,

backdropFilter: "blur(20px) saturate(180%)",
WebkitBackdropFilter: "blur(20px) saturate(180%)",
    fontFamily:
      "'SF Mono', ui-monospace, 'Roboto Mono', Menlo, monospace",
    color: "#E2E8F0",
    userSelect: "none",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: ACCENT,
    boxShadow: `0 0 8px ${ACCENT}`,
  },
  title: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    fontWeight: 600,
    color: "#CBD5E1",
  },
  radarBox: {
  position: "relative",
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",

  background: "rgba(255,255,255,0.03)",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",

  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.06)",
},
  cornerTL: corner({ top: 4, left: 4, borderWidth: "1px 0 0 1px" }),
  cornerTR: corner({ top: 4, right: 4, borderWidth: "1px 1px 0 0" }),
  cornerBL: corner({ bottom: 4, left: 4, borderWidth: "0 0 1px 1px" }),
  cornerBR: corner({ bottom: 4, right: 4, borderWidth: "0 1px 1px 0" }),
  divider: {
    height: 1,
    background:
      "linear-gradient(90deg, transparent, rgba(148,163,184,0.25), transparent)",
    margin: "6px 0 8px",
  },
  footer: {
  display: "flex",
  flexDirection: "column",
  gap: 4,

  background: "rgba(255,255,255,0.03)",
  borderRadius: 10,
  padding: "8px 10px",

  border: "1px solid rgba(255,255,255,0.06)",
},
timeRow: {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  marginBottom: 4,
},
  time: { fontSize: 22, fontWeight: 700, letterSpacing: 1, color: "#F1F5F9" },
  date: { fontSize: 11, color: "#94A3B8", letterSpacing: 0.5 },
  metricRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 10.5,
  },
  label: { color: "#7C8696", letterSpacing: 1.4 },
  value: { fontWeight: 700, letterSpacing: 1 },
};

function corner(pos) {
  return {
    position: "absolute",
    width: 10,
    height: 10,
    borderStyle: "solid",
    borderColor: "rgba(79,70,229,0.6)",
    ...pos,
  };
}
