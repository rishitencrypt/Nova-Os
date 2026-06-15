import { useState, useEffect } from "react";

// --- time math -------------------------------------------------
function getDayProgress(now) {
  const secs =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  return secs / 86400; // 0..1
}

// Daytime window: 06:00 (0.25) -> 18:00 (0.75)
const DAY_START = 0.25;
const DAY_END = 0.75;

function getSkyPhase(p) {
  if (p < 0.22 || p >= 0.8) return "night";
  if (p < 0.3) return "dawn";
  if (p < 0.7) return "day";
  return "sunset";
}

// Position a body (0..1 across its window) on a semicircular arc.
// Returns percentages relative to the stage.
function arcPosition(t) {
  const angle = Math.PI * t; // 0 -> PI
  const radius = 42; // % of stage width
  const x = 50 - Math.cos(angle) * radius; // 8% -> 92%
  const y = 78 - Math.sin(angle) * 62; // baseline 78%, peak ~16%
  return { x, y, angle };
}

const SKY = {
  dawn: "linear-gradient(180deg,#2b1055 0%,#7b2d8e 40%,#ff8c42 100%)",
  day: "linear-gradient(180deg,#0a2a6b 0%,#1c6fd6 55%,#7ec8ff 100%)",
  sunset: "linear-gradient(180deg,#3a0d4a 0%,#b5305f 45%,#ff7e36 100%)",
  night: "linear-gradient(180deg,#020413 0%,#0a0f33 60%,#10173f 100%)",
};

const SUN_COLOR = {
  dawn: "#ffb24a",
  day: "#fff7e0",
  sunset: "#ff5e3a",
  night: "#ffb24a",
};

// Deterministic star field so it doesn't reshuffle each render
const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: (i * 53) % 100,
  top: (i * 29) % 70,
  size: (i % 3) + 1,
  delay: (i % 7) * 0.4,
}));

function CelestialClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    let raf;
    let last = 0;
    const loop = (ts) => {
      if (ts - last > 1000) {
        setNow(new Date());
        last = ts;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const p = getDayProgress(now);
  const phase = getSkyPhase(p);
  const isDay = p >= DAY_START && p < DAY_END;

  // normalized 0..1 position of each body within its own window
  const sunT = (p - DAY_START) / (DAY_END - DAY_START);
  // night runs 0.75 -> 1.0 then 0.0 -> 0.25 (wraps midnight)
  const nightSpan = (p >= DAY_END ? p - DAY_END : p + (1 - DAY_END)) / 0.5;

  const sun = arcPosition(Math.min(Math.max(sunT, 0), 1));
  const moon = arcPosition(Math.min(Math.max(nightSpan, 0), 1));

  const sunVisible = isDay;
  const starsVisible = !isDay;

  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <style>{css}</style>
      <div className="cc-widget">
        <div
          className="cc-stage"
          style={{ background: SKY[phase] }}
        >
          {/* nebula glow */}
          <div className="cc-nebula" />

          {/* planet silhouette */}
          <div className="cc-planet" />

          {/* stars */}
          <div
            className="cc-stars"
            style={{ opacity: starsVisible ? 1 : 0 }}
          >
            {STARS.map((s) => (
              <span
                key={s.id}
                className="cc-star"
                style={{
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  width: s.size,
                  height: s.size,
                  animationDelay: `${s.delay}s`,
                }}
              />
            ))}
          </div>

          {/* horizon line */}
          <div className="cc-horizon" />

          {/* sun */}
          <div
            className="cc-sun"
            style={{
              left: `${sun.x}%`,
              top: `${sun.y}%`,
              opacity: sunVisible ? 1 : 0,
              background: `radial-gradient(circle at 35% 35%, #fff, ${SUN_COLOR[phase]})`,
              boxShadow: `0 0 24px 8px ${SUN_COLOR[phase]}aa`,
            }}
          />

          {/* moon */}
          <div
            className="cc-moon"
            style={{
              left: `${moon.x}%`,
              top: `${moon.y}%`,
              opacity: starsVisible ? 1 : 0,
            }}
          >
            <span className="cc-moon-crater c1" />
            <span className="cc-moon-crater c2" />
          </div>
        </div>

        {/* readout */}
        <div className="cc-readout">
          <div className="cc-label">SOLAR CYCLE</div>
          <div className="cc-time">{time}</div>
          <div className="cc-date">{date}</div>
          <div className="cc-sector">NOVA SECTOR</div>
        </div>
      </div>
    </>
  );
}

const css = `
.cc-widget{
  position: fixed;
  top: 420px;
  right: 24px;
  width: 290px;
  border-radius: 22px;
  overflow: hidden;
  z-index: 1000;
  font-family: "SF Pro Display", "Inter", system-ui, sans-serif;
  background: rgba(20,24,48,0.35);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.18);
  box-shadow: 0 12px 40px rgba(0,0,0,0.45),
              inset 0 1px 0 rgba(255,255,255,0.25);
}

.cc-stage{
  position: relative;
  height: 170px;
  transition: background 2s ease;
  overflow: hidden;
}

.cc-nebula{
  position:absolute; inset:-30%;
  background: radial-gradient(circle at 70% 30%, rgba(140,80,255,0.35), transparent 60%),
             radial-gradient(circle at 20% 80%, rgba(0,180,255,0.25), transparent 55%);
  filter: blur(8px);
  animation: cc-drift 18s ease-in-out infinite alternate;
}
@keyframes cc-drift{
  from{ transform: translate(0,0) scale(1); }
  to{ transform: translate(-12px,8px) scale(1.08); }
}

.cc-planet{
  position:absolute;
  width:120px; height:120px; border-radius:50%;
  right:-46px; bottom:-50px;
  background: radial-gradient(circle at 35% 30%, rgba(120,140,200,0.45), rgba(10,15,40,0.9));
  box-shadow: inset -10px -8px 30px rgba(0,0,0,0.6);
  opacity:0.55;
}

.cc-stars{ position:absolute; inset:0; transition: opacity 2s ease; }
.cc-star{
  position:absolute; border-radius:50%; background:#fff;
  box-shadow:0 0 6px rgba(255,255,255,0.9);
  animation: cc-twinkle 2.6s ease-in-out infinite;
}
@keyframes cc-twinkle{
  0%,100%{ opacity:.25; transform:scale(.8); }
  50%{ opacity:1; transform:scale(1.25); }
}

.cc-horizon{
  position:absolute; left:0; right:0; bottom:22%;
  height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent);
}

.cc-sun{
  position:absolute; width:34px; height:34px; border-radius:50%;
  transform: translate(-50%,-50%);
  transition: opacity 1.5s ease, background 2s ease, box-shadow 2s ease;
  animation: cc-pulse 4s ease-in-out infinite;
}
@keyframes cc-pulse{
  0%,100%{ filter:brightness(1); }
  50%{ filter:brightness(1.25); }
}

.cc-moon{
  position:absolute; width:28px; height:28px; border-radius:50%;
  transform: translate(-50%,-50%);
  background: radial-gradient(circle at 35% 35%, #ffffff, #bcd2ff 70%, #8fb0ff);
  box-shadow: 0 0 22px 6px rgba(150,190,255,0.55);
  transition: opacity 1.5s ease;
}
.cc-moon-crater{ position:absolute; border-radius:50%; background:rgba(120,150,210,0.5); }
.cc-moon-crater.c1{ width:7px; height:7px; top:6px; left:7px; }
.cc-moon-crater.c2{ width:4px; height:4px; top:15px; left:16px; }

.cc-readout{
  padding: 12px 16px 14px;
  background: linear-gradient(180deg, rgba(10,14,34,0.55), rgba(10,14,34,0.75));
  text-align:center; color:#eaf2ff;
}
.cc-label{
  font-size:10px; letter-spacing:3px; opacity:.7; font-weight:600;
}
.cc-time{
  font-size:34px; font-weight:300; letter-spacing:2px;
  margin:2px 0; text-shadow:0 0 14px rgba(120,180,255,0.5);
}
.cc-date{ font-size:12px; opacity:.75; letter-spacing:1px; }
.cc-sector{
  margin-top:8px; font-size:9px; letter-spacing:4px; opacity:.55;
  border-top:1px solid rgba(255,255,255,0.12); padding-top:8px;
}
`;

export default CelestialClock;
