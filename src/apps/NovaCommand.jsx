import { useState, useEffect, useRef, useCallback } from "react";

const PLANETS = [
  { id: "ac", name: "Alpha Centauri", x: 72, y: 30, dist: 4.37 },
  { id: "sr", name: "Sirius", x: 26, y: 62, dist: 8.6 },
  { id: "pr", name: "Proxima", x: 48, y: 20, dist: 4.24 },
  { id: "vg", name: "Vega", x: 60, y: 74, dist: 25 },
];

const RADAR_OBJECTS = [
  { label: "Asteroid Field", a: 40, r: 70 },
  { label: "Space Station", a: 130, r: 45 },
  { label: "Unknown Signal", a: 220, r: 82 },
  { label: "Deep Space Probe", a: 300, r: 58 },
];

const STAT_META = {
  hull: "Hull Integrity",
  engine: "Engine Power",
  shield: "Shield Strength",
  fuel: "Fuel Level",
  life: "Life Support",
  cargo: "Cargo Capacity",
};

const clamp = (v) => Math.max(0, Math.min(100, v));
const now = () =>
  new Date().toLocaleTimeString([], { hour12: false });

const barColor = (v) =>
  v > 60 ? "var(--ok)" : v > 30 ? "var(--warn)" : "var(--crit)";

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: (i * 41) % 100,
  top: (i * 67) % 100,
  delay: (i % 8) * 0.6,
}));

function NovaCommand() {
  const [ship, setShip] = useState({
    hull: 94,
    engine: 78,
    shield: 66,
    fuel: 83,
    life: 99,
    cargo: 42,
    energy: 61,
    signal: 88,
  });
  const [log, setLog] = useState([
    { t: now(), m: "Bridge systems online" },
    { t: now(), m: "Awaiting commands" },
  ]);
  const [target, setTarget] = useState(PLANETS[0]);
  const [navLock, setNavLock] = useState(true);
  const [effect, setEffect] = useState(null);
  const [reactor, setReactor] = useState(
    Array.from({ length: 24 }, () => 50)
  );
  const logRef = useRef(null);

  const pushLog = useCallback((m) => {
    setLog((l) => [...l.slice(-40), { t: now(), m }]);
  }, []);

  const flash = useCallback((fx) => {
    setEffect(fx);
    setTimeout(() => setEffect(null), 900);
  }, []);

  // live fluctuations + reactor graph
  useEffect(() => {
    const id = setInterval(() => {
      setShip((s) => {
        const d = (amp) => (Math.random() - 0.5) * amp;
        return {
          ...s,
          hull: clamp(s.hull + d(0.6)),
          engine: clamp(s.engine + d(3)),
          shield: clamp(s.shield + d(2.5)),
          fuel: clamp(s.fuel - Math.random() * 0.3),
          life: clamp(s.life + d(0.4)),
          cargo: clamp(s.cargo + d(0.5)),
          energy: clamp(s.energy + d(4)),
          signal: clamp(s.signal + d(3)),
        };
      });
      setReactor((r) => [...r.slice(1), 40 + Math.random() * 50]);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  // autoscroll log
  useEffect(() => {
    if (logRef.current)
      logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const runCommand = (name) => {
    setShip((s) => {
      const n = { ...s };
      switch (name) {
        case "Scan Sector":
          n.energy = clamp(s.energy - 6);
          n.signal = clamp(s.signal + 8);
          break;
        case "Hyperdrive":
          n.fuel = clamp(s.fuel - 14);
          n.engine = clamp(s.engine + 10);
          n.energy = clamp(s.energy - 18);
          break;
        case "Docking Mode":
          n.engine = clamp(s.engine - 20);
          n.shield = clamp(s.shield - 10);
          break;
        case "Long Range Sensors":
          n.energy = clamp(s.energy - 9);
          n.signal = clamp(s.signal + 12);
          break;
        case "Shield Boost":
          n.shield = clamp(s.shield + 22);
          n.energy = clamp(s.energy - 12);
          break;
        case "Emergency Protocol":
          n.shield = clamp(s.shield + 30);
          n.hull = clamp(s.hull + 8);
          n.life = clamp(s.life + 5);
          n.energy = clamp(s.energy - 25);
          break;
        default:
          break;
      }
      return n;
    });

    const fx = {
      "Scan Sector": "scan",
      Hyperdrive: "warp",
      "Docking Mode": "dock",
      "Long Range Sensors": "scan",
      "Shield Boost": "shield",
      "Emergency Protocol": "alert",
    }[name];
    flash(fx);

    const msg = {
      "Scan Sector": "Sector Scan Complete",
      Hyperdrive: "Hyperdrive Charging",
      "Docking Mode": "Docking Clamps Engaged",
      "Long Range Sensors": "Long Range Sensors Activated",
      "Shield Boost": "Shield Matrix Reinforced",
      "Emergency Protocol": "EMERGENCY PROTOCOL ENGAGED",
    }[name];
    pushLog(msg);
  };

  const selectPlanet = (p) => {
    setTarget(p);
    setNavLock(true);
    pushLog(`Course plotted: ${p.name}`);
    flash("scan");
  };

  const travelDays = Math.round(target.dist * 4.1);

  return (
    <>
      <style>{css}</style>
      <div className={`nc-root ${effect ? "fx-" + effect : ""}`}>
        {/* LEFT: SHIP STATUS */}
        <div className="nc-panel nc-left">
          <div className="nc-title">SHIP STATUS</div>
          {Object.keys(STAT_META).map((k) => (
            <div className="nc-stat" key={k}>
              <div className="nc-stat-row">
                <span>{STAT_META[k]}</span>
                <span className="nc-pct">{Math.round(ship[k])}%</span>
              </div>
              <div className="nc-bar">
                <div
                  className="nc-bar-fill"
                  style={{
                    width: `${ship[k]}%`,
                    background: barColor(ship[k]),
                    boxShadow: `0 0 10px ${barColor(ship[k])}`,
                  }}
                />
              </div>
            </div>
          ))}

          <div className="nc-sub">REACTOR OUTPUT</div>
          <svg className="nc-reactor" viewBox="0 0 100 40" preserveAspectRatio="none">
            <polyline
              points={reactor
                .map((v, i) => `${(i / (reactor.length - 1)) * 100},${40 - (v / 100) * 38}`)
                .join(" ")}
            />
          </svg>

          <div className="nc-meter">
            <span>ENERGY</span>
            <div className="nc-bar">
              <div
                className="nc-bar-fill"
                style={{ width: `${ship.energy}%`, background: "var(--cyan)" }}
              />
            </div>
          </div>
        </div>

        {/* CENTER: STAR MAP */}
        <div className="nc-center">
          <div className="nc-grid" />
          <div className="nc-particles">
            {PARTICLES.map((p) => (
              <span
                key={p.id}
                className="nc-particle"
                style={{ left: `${p.left}%`, top: `${p.top}%`, animationDelay: `${p.delay}s` }}
              />
            ))}
          </div>

          {/* orbit + planet */}
          <div className="nc-orbit o1" />
          <div className="nc-orbit o2" />
          <div className="nc-orbit o3" />
          <div className="nc-planet" />

          {/* route line */}
          <svg className="nc-routes" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line className="nc-route" x1="50" y1="50" x2={target.x} y2={target.y} />
          </svg>

          {/* selectable planets */}
          {PLANETS.map((p) => (
            <button
              key={p.id}
              className={`nc-node ${target.id === p.id ? "active" : ""}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              onClick={() => selectPlanet(p)}
              title={p.name}
            >
              <span className="nc-node-dot" />
              <span className="nc-node-label">{p.name}</span>
            </button>
          ))}

          {/* radar */}
          <div className="nc-radar">
            <div className="nc-radar-sweep" />
            {RADAR_OBJECTS.map((o, i) => {
              const rad = (o.a * Math.PI) / 180;
              const x = 50 + Math.cos(rad) * (o.r / 2.4);
              const y = 50 + Math.sin(rad) * (o.r / 2.4);
              return (
                <span
                  key={i}
                  className="nc-blip"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  title={o.label}
                />
              );
            })}
          </div>

          {/* nav readout */}
          <div className="nc-nav">
            <div className="nc-nav-row"><b>TARGET</b><span>{target.name}</span></div>
            <div className="nc-nav-row"><b>DISTANCE</b><span>{target.dist} LY</span></div>
            <div className="nc-nav-row"><b>TRAVEL</b><span>{travelDays} Days</span></div>
            <div className="nc-nav-row">
              <b>COORD</b><span>{target.x.toFixed(1)} / {target.y.toFixed(1)}</span>
            </div>
            <div className={`nc-lock ${navLock ? "on" : ""}`}>
              NAV {navLock ? "LOCKED" : "STANDBY"}
            </div>
          </div>

          {/* signal + warnings */}
          <div className="nc-topbar">
            <span className="nc-sig">
              SIGNAL <b>{Math.round(ship.signal)}%</b>
              <i className="nc-sig-bars" style={{ "--s": ship.signal }} />
            </span>
            <span className={`nc-warn ${ship.hull < 40 ? "crit" : ship.shield < 35 ? "warn" : ""}`}>
              {ship.hull < 40 ? "HULL BREACH" : ship.shield < 35 ? "SHIELDS LOW" : "ALL SYSTEMS NOMINAL"}
            </span>
          </div>
        </div>

        {/* RIGHT: MISSION CONTROL */}
        <div className="nc-panel nc-right">
          <div className="nc-title">MISSION CONTROL</div>
          {["Scan Sector","Hyperdrive","Docking Mode","Long Range Sensors","Shield Boost","Emergency Protocol"]
            .map((b) => (
              <button
                key={b}
                className={`nc-cmd ${b === "Emergency Protocol" ? "danger" : ""}`}
                onClick={() => runCommand(b)}
              >
                <span className="nc-cmd-light" />
                {b}
              </button>
          ))}

          <div className="nc-sub">SYSTEM LIGHTS</div>
          <div className="nc-lights">
            {["NAV","PWR","COM","ENV","WPN","SNS"].map((l, i) => (
              <span key={l} className="nc-led" style={{ animationDelay: `${i * 0.3}s` }}>
                <i /> {l}
              </span>
            ))}
          </div>
        </div>

        {/* BOTTOM: COMMAND LOG */}
        <div className="nc-log" ref={logRef}>
          <div className="nc-log-title">COMMAND LOG</div>
          {log.map((e, i) => (
            <div className="nc-log-line" key={i}>
              <span className="nc-log-time">[{e.t}]</span> {e.m}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

const css = `
.nc-root{
  --cyan:#3fe0ff; --ok:#4dffb0; --warn:#ffd24d; --crit:#ff5d6c;
  position:relative; width:100%; height:100%;
  display:grid; gap:10px; padding:12px;
  grid-template-columns: 210px 1fr 210px;
  grid-template-rows: 1fr 130px;
  grid-template-areas: "left center right" "log log log";
  background:
    radial-gradient(circle at 50% 30%, #07142e 0%, #02060f 75%);
  color:#cfeaff; font-family:"SF Mono","Consolas",monospace;
  font-size:12px; box-sizing:border-box; overflow:hidden;
}
.nc-root::after{ /* command effect overlay */
  content:""; position:absolute; inset:0; pointer-events:none;
  opacity:0; transition:opacity .2s; z-index:50;
}
.fx-warp::after{ background:radial-gradient(circle,#3fe0ff44,transparent 70%); opacity:1; animation:nc-fade .9s; }
.fx-shield::after{ box-shadow:inset 0 0 80px #4dffb0; opacity:1; animation:nc-fade .9s; }
.fx-alert::after{ background:#ff003311; box-shadow:inset 0 0 90px #ff5d6c; opacity:1; animation:nc-fade .9s; }
.fx-scan::after{ background:radial-gradient(circle,#3fe0ff22,transparent 60%); opacity:1; animation:nc-fade .9s; }
.fx-dock::after{ box-shadow:inset 0 0 60px #ffd24d; opacity:1; animation:nc-fade .9s; }
@keyframes nc-fade{ from{opacity:1} to{opacity:0} }

.nc-panel{
  background:rgba(10,22,44,0.45); backdrop-filter:blur(14px);
  border:1px solid rgba(63,224,255,0.25); border-radius:14px;
  padding:12px; overflow-y:auto;
  box-shadow:inset 0 0 20px rgba(63,224,255,0.08);
}
.nc-left{ grid-area:left; } .nc-right{ grid-area:right; }
.nc-title{
  font-size:12px; letter-spacing:3px; color:var(--cyan);
  border-bottom:1px solid rgba(63,224,255,0.3); padding-bottom:8px; margin-bottom:12px;
  text-shadow:0 0 10px var(--cyan);
}
.nc-sub{ margin:14px 0 6px; font-size:10px; letter-spacing:2px; opacity:.6; }

.nc-stat{ margin-bottom:10px; }
.nc-stat-row{ display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px; }
.nc-pct{ color:var(--cyan); }
.nc-bar{ height:7px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden; }
.nc-bar-fill{ height:100%; border-radius:4px; transition:width .8s ease, background .8s ease; }

.nc-reactor{ width:100%; height:46px; }
.nc-reactor polyline{ fill:none; stroke:var(--cyan); stroke-width:1.2; filter:drop-shadow(0 0 4px var(--cyan)); }
.nc-meter span{ font-size:10px; letter-spacing:2px; opacity:.7; display:block; margin-bottom:4px; }

/* center */
.nc-center{
  grid-area:center; position:relative; border-radius:14px; overflow:hidden;
  border:1px solid rgba(63,224,255,0.2);
  background:radial-gradient(circle at 50% 50%, #06142c, #020611);
}
.nc-grid{
  position:absolute; inset:0;
  background-image:linear-gradient(rgba(63,224,255,0.08) 1px,transparent 1px),
                   linear-gradient(90deg,rgba(63,224,255,0.08) 1px,transparent 1px);
  background-size:32px 32px;
  mask:radial-gradient(circle at 50% 50%, #000 55%, transparent 80%);
}
.nc-particles{ position:absolute; inset:0; }
.nc-particle{
  position:absolute; width:2px; height:2px; border-radius:50%;
  background:#3fe0ff; box-shadow:0 0 6px #3fe0ff;
  animation:nc-twinkle 3s ease-in-out infinite;
}
@keyframes nc-twinkle{ 0%,100%{opacity:.2} 50%{opacity:1} }

.nc-orbit{
  position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
  border:1px solid rgba(63,224,255,0.18); border-radius:50%;
}
.o1{ width:120px; height:120px; } .o2{ width:200px; height:200px; }
.o3{ width:290px; height:290px; }
.nc-planet{
  position:absolute; left:50%; top:50%; width:54px; height:54px;
  transform:translate(-50%,-50%); border-radius:50%;
  background:radial-gradient(circle at 35% 32%, #6fd0ff, #155, #022);
  box-shadow:0 0 30px #3fe0ff88, inset -8px -6px 18px #000;
  animation:nc-rot 30s linear infinite;
}
@keyframes nc-rot{ from{filter:hue-rotate(0)} to{filter:hue-rotate(40deg)} }

.nc-routes{ position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
.nc-route{ stroke:var(--cyan); stroke-width:0.5; stroke-dasharray:2 2;
  filter:drop-shadow(0 0 3px var(--cyan)); animation:nc-dash 1s linear infinite; }
@keyframes nc-dash{ to{stroke-dashoffset:-8} }

.nc-node{
  position:absolute; transform:translate(-50%,-50%);
  background:none; border:none; cursor:pointer; color:#cfeaff;
  display:flex; flex-direction:column; align-items:center; gap:3px;
}
.nc-node-dot{ width:10px; height:10px; border-radius:50%;
  background:#9fdcff; box-shadow:0 0 8px #3fe0ff; transition:.3s; }
.nc-node.active .nc-node-dot{ background:var(--ok); box-shadow:0 0 14px var(--ok); transform:scale(1.4); }
.nc-node-label{ font-size:9px; letter-spacing:1px; opacity:.8; white-space:nowrap; }

.nc-radar{
  position:absolute; right:12px; bottom:12px; width:96px; height:96px;
  border-radius:50%; border:1px solid rgba(63,224,255,0.4);
  background:radial-gradient(circle,rgba(63,224,255,0.06),transparent);
  overflow:hidden;
}
.nc-radar-sweep{
  position:absolute; inset:0;
  background:conic-gradient(from 0deg, rgba(63,224,255,0.5), transparent 30%);
  animation:nc-sweep 3s linear infinite;
}
@keyframes nc-sweep{ to{transform:rotate(360deg)} }
.nc-blip{ position:absolute; width:5px; height:5px; border-radius:50%;
  transform:translate(-50%,-50%); background:var(--ok);
  box-shadow:0 0 8px var(--ok); animation:nc-twinkle 2s infinite; }

.nc-nav{
  position:absolute; left:12px; top:12px; width:150px;
  background:rgba(4,12,28,0.6); border:1px solid rgba(63,224,255,0.25);
  border-radius:10px; padding:10px; backdrop-filter:blur(8px);
}
.nc-nav-row{ display:flex; justify-content:space-between; margin-bottom:5px; font-size:10px; }
.nc-nav-row b{ opacity:.6; letter-spacing:1px; } .nc-nav-row span{ color:var(--cyan); }
.nc-lock{ margin-top:6px; text-align:center; font-size:10px; letter-spacing:2px;
  padding:4px; border-radius:6px; background:rgba(255,210,77,0.15); color:var(--warn); }
.nc-lock.on{ background:rgba(77,255,176,0.15); color:var(--ok);
  box-shadow:0 0 12px rgba(77,255,176,0.3); }

.nc-topbar{ position:absolute; top:12px; right:12px; display:flex; flex-direction:column;
  align-items:flex-end; gap:6px; }
.nc-sig{ font-size:10px; letter-spacing:1px; }
.nc-sig b{ color:var(--cyan); }
.nc-warn{ font-size:10px; letter-spacing:2px; padding:3px 8px; border-radius:6px;
  background:rgba(77,255,176,0.12); color:var(--ok); }
.nc-warn.warn{ background:rgba(255,210,77,0.15); color:var(--warn); animation:nc-blink 1s infinite; }
.nc-warn.crit{ background:rgba(255,93,108,0.2); color:var(--crit); animation:nc-blink .6s infinite; }
@keyframes nc-blink{ 50%{opacity:.4} }

/* commands */
.nc-cmd{
  width:100%; margin-bottom:8px; padding:10px; cursor:pointer;
  display:flex; align-items:center; gap:8px;
  background:rgba(63,224,255,0.08); color:#dff4ff;
  border:1px solid rgba(63,224,255,0.3); border-radius:9px;
  font-family:inherit; font-size:11px; letter-spacing:1px;
  transition:.18s;
}
.nc-cmd:hover{ background:rgba(63,224,255,0.2); box-shadow:0 0 14px rgba(63,224,255,0.4);
  transform:translateX(-2px); }
.nc-cmd:active{ transform:scale(.97); }
.nc-cmd.danger{ border-color:rgba(255,93,108,0.5); color:#ffd0d5; }
.nc-cmd.danger:hover{ background:rgba(255,93,108,0.2); box-shadow:0 0 16px rgba(255,93,108,0.5); }
.nc-cmd-light{ width:8px; height:8px; border-radius:50%; background:var(--cyan);
  box-shadow:0 0 8px var(--cyan); animation:nc-blink 2s infinite; }
.nc-cmd.danger .nc-cmd-light{ background:var(--crit); box-shadow:0 0 8px var(--crit); }

.nc-lights{ display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.nc-led{ display:flex; align-items:center; gap:5px; font-size:10px; opacity:.8; }
.nc-led i{ width:7px; height:7px; border-radius:50%; background:var(--ok);
  box-shadow:0 0 7px var(--ok); animation:nc-blink 1.6s infinite; }

/* log */
.nc-log{
  grid-area:log; overflow-y:auto;
  background:rgba(4,10,24,0.55); border:1px solid rgba(63,224,255,0.22);
  border-radius:12px; padding:10px 14px; backdrop-filter:blur(10px);
}
.nc-log-title{ font-size:11px; letter-spacing:3px; color:var(--cyan);
  margin-bottom:8px; text-shadow:0 0 8px var(--cyan); position:sticky; top:0; }
.nc-log-line{ font-size:11px; margin-bottom:3px; opacity:.9; }
.nc-log-time{ color:var(--cyan); margin-right:6px; }

/* scrollbars */
.nc-panel::-webkit-scrollbar,.nc-log::-webkit-scrollbar{ width:6px; }
.nc-panel::-webkit-scrollbar-thumb,.nc-log::-webkit-scrollbar-thumb{
  background:rgba(63,224,255,0.3); border-radius:3px; }
`;

export default NovaCommand;
