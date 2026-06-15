import { useState, useEffect, useRef } from "react";

// deterministic star + particle fields (no reshuffle on render)
const STARS = Array.from({ length: 46 }, (_, i) => ({
  id: i,
  left: (i * 37) % 100,
  top: (i * 61) % 100,
  size: (i % 3) + 1,
  delay: (i % 9) * 0.35,
}));

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: (i * 53) % 100,
  delay: (i % 6) * 1.2,
  dur: 8 + (i % 5),
}));

function jitter(base, amp, decimals) {
  const v = base + (Math.random() - 0.5) * amp;
  return v.toFixed(decimals);
}

function OrbitalWidget() {
  const [tel, setTel] = useState({
    alt: 348420,
    vel: 7.66,
    period: 92.3,
    signal: 98,
  });
  const last = useRef(0);

  useEffect(() => {
    let raf;
    const loop = (ts) => {
      if (ts - last.current > 1400) {
        last.current = ts;
        setTel({
          alt: Math.round(348420 + (Math.random() - 0.5) * 60),
          vel: +jitter(7.66, 0.04, 2),
          period: +jitter(92.3, 0.2, 1),
          signal: Math.min(
            99,
            Math.max(95, Math.round(98 + (Math.random() - 0.5) * 3))
          ),
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <style>{css}</style>
      <div className="ow-widget">
        <div className="ow-stage">
          {/* background layers */}
          <div className="ow-nebula" />
          <div className="ow-stars">
            {STARS.map((s) => (
              <span
                key={s.id}
                className="ow-star"
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
          <div className="ow-particles">
            {PARTICLES.map((p) => (
              <span
                key={p.id}
                className="ow-particle"
                style={{
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.dur}s`,
                }}
              />
            ))}
          </div>

          {/* orbital system */}
          <div className="ow-orbit-wrap">
            <div className="ow-ring ow-ring-3" />
            <div className="ow-ring ow-ring-2" />

            {/* planet */}
            <div className="ow-planet">
              <div className="ow-surface" />
              <div className="ow-lights" />
              <div className="ow-clouds" />
              <div className="ow-terminator" />
              <div className="ow-atmos" />
              <div className="ow-rim" />
            </div>

            {/* front ring + satellite (drawn above planet) */}
            <div className="ow-ring ow-ring-1 ow-ring-glow" />
            <div className="ow-sat-orbit">
              <div className="ow-trail" />
              <div className="ow-sat">
                <span className="ow-sat-body" />
                <span className="ow-sat-panel left" />
                <span className="ow-sat-panel right" />
              </div>
            </div>
          </div>
        </div>

        {/* telemetry */}
        <div className="ow-panel">
          <div className="ow-head">
            <span className="ow-dot" /> ORBITAL STATUS
          </div>
          <div className="ow-grid">
            <Row label="Altitude" value={`${tel.alt.toLocaleString()} km`} />
            <Row label="Velocity" value={`${tel.vel} km/s`} />
            <Row label="Orbital Period" value={`${tel.period} min`} />
            <Row label="Signal Strength" value={`${tel.signal}%`} />
            <Row label="Tracking" value="LOCKED" accent="lock" />
            <Row label="Mission Status" value="STABLE" accent="stable" />
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, accent }) {
  return (
    <div className="ow-row">
      <span className="ow-row-label">{label}</span>
      <span className={`ow-row-value ${accent || ""}`}>{value}</span>
    </div>
  );
}

const css = `
.ow-widget{
  position: fixed;
  top: 24px;
  right: 24px;
  width: 300px;
  border-radius: 22px;
  overflow: hidden;
  z-index: 1000;
  font-family: "SF Pro Display","Inter",system-ui,sans-serif;
  color:#dCeBff;
  background: rgba(12,16,34,0.42);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid rgba(140,180,255,0.22);
  box-shadow: 0 16px 48px rgba(0,0,0,0.55),
              inset 0 1px 0 rgba(255,255,255,0.22);
}

.ow-stage{
  position:relative; height:210px; overflow:hidden;
  background: radial-gradient(circle at 50% 40%, #0a1330 0%, #03060f 80%);
}

/* background */
.ow-nebula{
  position:absolute; inset:-25%;
  background:
    radial-gradient(circle at 72% 28%, rgba(120,70,255,0.30), transparent 58%),
    radial-gradient(circle at 22% 78%, rgba(0,160,255,0.22), transparent 55%);
  filter: blur(10px);
  animation: ow-drift 22s ease-in-out infinite alternate;
}
@keyframes ow-drift{ from{transform:translate(0,0)} to{transform:translate(-14px,10px) scale(1.08)} }

.ow-stars{ position:absolute; inset:0; }
.ow-star{
  position:absolute; border-radius:50%; background:#fff;
  box-shadow:0 0 6px rgba(255,255,255,.9);
  animation: ow-twinkle 3s ease-in-out infinite;
}
@keyframes ow-twinkle{ 0%,100%{opacity:.2;transform:scale(.8)} 50%{opacity:1;transform:scale(1.3)} }

.ow-particles{ position:absolute; inset:0; }
.ow-particle{
  position:absolute; bottom:-6px; width:2px; height:2px; border-radius:50%;
  background:rgba(150,200,255,.8); box-shadow:0 0 6px rgba(150,200,255,.8);
  animation: ow-float linear infinite;
}
@keyframes ow-float{ from{transform:translateY(0);opacity:0} 10%{opacity:1} 90%{opacity:1} to{transform:translateY(-220px);opacity:0} }

/* orbit system */
.ow-orbit-wrap{
  position:absolute; left:50%; top:48%;
  width:160px; height:160px; transform:translate(-50%,-50%);
}
.ow-ring{
  position:absolute; inset:0; border-radius:50%;
  border:1px solid rgba(130,180,255,0.28);
  transform-style:preserve-3d;
}
.ow-ring-1{ transform: rotateX(74deg); }
.ow-ring-2{ transform: rotateX(74deg) scale(1.28); border-color:rgba(130,180,255,0.16); }
.ow-ring-3{ transform: rotateX(74deg) scale(1.6); border-color:rgba(130,180,255,0.10); }
.ow-ring-glow{ animation: ow-ringpulse 6s linear infinite; }
@keyframes ow-ringpulse{
  0%,100%{ box-shadow:0 0 0 rgba(120,180,255,0); }
  46%{ box-shadow:0 0 0 rgba(120,180,255,0); }
  50%{ box-shadow:0 0 18px rgba(120,190,255,0.6); }
  54%{ box-shadow:0 0 0 rgba(120,180,255,0); }
}

/* planet */
.ow-planet{
  position:absolute; left:50%; top:50%;
  width:96px; height:96px; border-radius:50%;
  transform:translate(-50%,-50%);
  overflow:hidden;
  box-shadow: inset -14px -10px 40px rgba(0,0,0,0.75);
}
.ow-surface{
  position:absolute; inset:-50%;
  background:
    radial-gradient(circle at 30% 30%, #2e6fb0 0%, #14406e 40%, #0a2447 70%),
    repeating-radial-gradient(circle at 40% 60%, rgba(40,120,80,0.6) 0 8px, transparent 8px 22px);
  background-size: 200% 100%, 200% 100%;
  animation: ow-spin 40s linear infinite;
}
@keyframes ow-spin{ from{background-position:0 0,0 0} to{background-position:200% 0,200% 0} }

.ow-lights{
  position:absolute; inset:0;
  background: radial-gradient(circle at 78% 55%, rgba(255,210,120,0.0) 0 30%,
              rgba(255,200,110,0.55) 55%, transparent 75%);
  mix-blend-mode:screen;
  background-size:200% 100%;
  animation: ow-spin 40s linear infinite, ow-flicker 3s ease-in-out infinite;
  opacity:.0;
}
/* lights only visible on night hemisphere via terminator overlay below */
.ow-planet:hover .ow-lights{ opacity:1; }
.ow-lights{ opacity:1; }
@keyframes ow-flicker{ 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.4)} }

.ow-clouds{
  position:absolute; inset:-50%;
  background:
    radial-gradient(circle at 20% 40%, rgba(255,255,255,0.5) 0 6px, transparent 7px 26px),
    radial-gradient(circle at 60% 70%, rgba(255,255,255,0.4) 0 5px, transparent 6px 24px);
  background-size:200% 100%;
  opacity:.5;
  animation: ow-clouds 28s linear infinite;
}
@keyframes ow-clouds{ from{background-position:0 0} to{background-position:-200% 0} }

.ow-terminator{
  position:absolute; inset:0;
  background: linear-gradient(105deg, transparent 40%, rgba(0,0,8,0.78) 70%);
}
.ow-atmos{
  position:absolute; inset:0; border-radius:50%;
  box-shadow: inset 8px 6px 24px rgba(120,190,255,0.35);
}
.ow-rim{
  position:absolute; inset:-6px; border-radius:50%;
  box-shadow: 0 0 22px 4px rgba(90,170,255,0.55),
              inset 0 0 14px rgba(120,200,255,0.4);
  border:1px solid rgba(130,200,255,0.35);
}

/* satellite */
.ow-sat-orbit{
  position:absolute; inset:0; transform: rotateX(74deg);
  animation: ow-orbit 6s linear infinite;
  transform-style:preserve-3d;
}
@keyframes ow-orbit{ from{transform:rotateX(74deg) rotateZ(0)} to{transform:rotateX(74deg) rotateZ(360deg)} }
.ow-sat{
  position:absolute; top:-5px; left:50%; transform:translateX(-50%);
  width:10px; height:6px;
}
.ow-sat-body{
  position:absolute; inset:0; border-radius:2px;
  background:linear-gradient(#e8f1ff,#9fb6d8);
  box-shadow:0 0 8px rgba(180,210,255,0.9);
}
.ow-sat-panel{ position:absolute; top:1px; width:5px; height:4px; background:#2b6fd6; }
.ow-sat-panel.left{ left:-6px; } .ow-sat-panel.right{ right:-6px; }
.ow-trail{
  position:absolute; inset:0; border-radius:50%;
  border-top:2px solid rgba(150,200,255,0.5);
  border-right:2px solid rgba(150,200,255,0.12);
  border-bottom:2px solid transparent; border-left:2px solid transparent;
  filter: blur(0.4px);
}

/* telemetry */
.ow-panel{
  padding:12px 16px 14px;
  background:linear-gradient(180deg, rgba(8,12,30,0.6), rgba(8,12,30,0.82));
  border-top:1px solid rgba(140,180,255,0.14);
}
.ow-head{
  display:flex; align-items:center; gap:8px;
  font-size:11px; letter-spacing:3px; font-weight:600; opacity:.85;
  margin-bottom:10px;
}
.ow-dot{
  width:7px; height:7px; border-radius:50%; background:#4dffa6;
  box-shadow:0 0 8px #4dffa6; animation: ow-blink 2s ease-in-out infinite;
}
@keyframes ow-blink{ 0%,100%{opacity:1} 50%{opacity:.3} }

.ow-grid{ display:flex; flex-direction:column; gap:7px; }
.ow-row{ display:flex; justify-content:space-between; align-items:baseline; }
.ow-row-label{ font-size:11px; letter-spacing:1px; opacity:.6; }
.ow-row-value{
  font-size:13px; font-variant-numeric:tabular-nums; font-weight:500;
  letter-spacing:1px; transition: all .8s ease;
  text-shadow:0 0 10px rgba(120,180,255,0.4);
}
.ow-row-value.lock{ color:#4dd2ff; text-shadow:0 0 10px rgba(77,210,255,.6); }
.ow-row-value.stable{ color:#4dffa6; text-shadow:0 0 10px rgba(77,255,166,.6); }
`;

export default OrbitalWidget;
