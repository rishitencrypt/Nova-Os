import { useState, useEffect, useRef } from "react";


const ACCENT = "#6366F1";
const CONTACT = "rgba(220,220,220,0.9)";
const ORANGE = "#ffffffc7";

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
      sg.addColorStop(0, "rgba(255,255,255,0.08)");
sg.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.restore();

      // Sweep leading line
      ctx.strokeStyle = "rgba(220,220,220,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
      ctx.stroke();

      // Contacts (light up when sweep passes)
      contacts.forEach((c) => {
        const x = cx + Math.cos(c.angle) * maxR * c.radius;
        const y = cy + Math.sin(c.angle) * maxR * c.radius;
        ctx.fillStyle = CONTACT;

ctx.beginPath();
ctx.arc(x, y, 2.5, 0, Math.PI * 2);
ctx.fill();
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

  const tracks = contacts.length;

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const dateStr = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <span style={styles.dot} />
        <div>
  <div style={styles.title}>
    NOVA SCANNER
  </div>

  <div
    style={{
      fontSize: 11,
      color: "#94A3B8",
      marginTop: 2,
    }}
  >
    Long Range Sensor Grid
  </div>
</div>
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
  <span style={styles.label}>TRACKS</span>
  <span style={styles.value}>{tracks}</span>
</div>

<div style={styles.metricRow}>
  <span style={styles.label}>SIGNAL</span>
  <span style={{ ...styles.value, color: ORANGE }}>
    {signal}%
  </span>
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

  width: 320,
  height: 420,

  display: "flex",
  flexDirection: "column",

  overflow: "hidden",

  borderRadius: 28,

  background:
    "linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))",

  border:
    "1px solid rgba(255,255,255,0.12)",

  backdropFilter: "blur(28px)",
  WebkitBackdropFilter: "blur(28px)",

  boxShadow:
    "0 20px 60px rgba(0,0,0,0.45)",

  color: "#E2E8F0",
},
  header: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",

  padding: "16px 18px",

  borderBottom:
    "1px solid rgba(144, 29, 29, 0.08)",
},
  dot: {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "#11c1e4",
},
  title: {
  fontSize: 18,
  fontWeight: 800,
  letterSpacing: 1,

  color: "#c2c2c2",
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
  gap: 8,
  padding: "14px 16px",
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
    borderColor: "rgba(255,255,255,0.18)",
    ...pos,
  };
}
