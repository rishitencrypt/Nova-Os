import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import "./StellarNavigation.css";

/* ============================================================
   StellarNavigation — NovaOS deep-space bridge simulator
   ------------------------------------------------------------
   Architecture:
     - StellarNavigation (root)         owns game state + loop
     - useGameLoop hook                  fixed-timestep RAF loop
     - useInput hook                     keyboard + wheel
     - <Starfield/>                      CSS parallax star layers
     - <SceneCanvas/>                    canvas 2D: asteroids,
                                         planets, stations, ship,
                                         particles
     - <SystemsPanel/>                   hull / shield / fuel / O2 /
                                         reactor / nav status
     - <NavMap/>                         top-down sector minimap
     - <Radar/>                          live nearby-objects radar
     - <MissionLog/>                     scrolling event feed
     - <Inventory/>                      collected resources
     - <Hud/>                             speed, heading, sector,
                                         alerts, AI comm
   ============================================================ */

/* ---------------- Constants ---------------- */

const WORLD = {
  // World units per second at full throttle
  maxSpeed: 420,
  boostMultiplier: 2.2,
  brakeRate: 320,
  accelRate: 260,
  rotateRate: 1.8, // rad/s
  fuelBurnPerSec: 0.55,
  fuelBurnBoost: 1.6,
  o2DrainPerSec: 0.08,
  reactorDrainPerSec: 0.05,
  collisionDamage: 14,
  shieldRegenPerSec: 1.6,
  hullRegenPerSec: 0.2, // slow self-repair
  scanRange: 520,
  radarRange: 1100,
};

const SECTOR_SIZE = 4000;
const VIEWPORT_BASE = 720; // base vertical world-units visible

/* ---------------- Helpers ---------------- */

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const dist2 = (ax, ay, bx, by) => {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
};

/* Seeded RNG (mulberry32) for reproducible sector layouts */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- Asset generation ---------------- */

const NEBULA_COLORS = [
  ["#1a2a4a", "#2a4a8a"],
  ["#3a1a3a", "#6a2a6a"],
  ["#1a3a3a", "#2a6a6a"],
  ["#3a2a1a", "#6a4a2a"],
  ["#2a1a3a", "#4a2a6a"],
];

const PLANET_PALETTES = [
  { core: "#d4a574", rim: "#7a5230", atmo: "rgba(220,180,120,0.4)" },
  { core: "#6ab7d4", rim: "#2a5a7a", atmo: "rgba(120,200,240,0.4)" },
  { core: "#d46a6a", rim: "#7a2a2a", atmo: "rgba(240,140,140,0.4)" },
  { core: "#9ad46a", rim: "#4a7a2a", atmo: "rgba(180,220,140,0.4)" },
  { core: "#b4b4d4", rim: "#5a5a7a", atmo: "rgba(200,200,240,0.4)" },
  { core: "#e0c080", rim: "#8a6a3a", atmo: "rgba(240,220,160,0.4)" },
];

const RESOURCE_TYPES = [
  { id: "titanium", name: "Titanium", color: "#c8d0e0", icon: "Ti" },
  { id: "deuterium", name: "Deuterium", color: "#6ad4ff", icon: "D" },
  { id: "iridium", name: "Iridium", color: "#ffd470", icon: "Ir" },
  { id: "crystal", name: "Crystal", color: "#d46aff", icon: "Cr" },
  { id: "antimatter", name: "Antimatter", color: "#ff6a8a", icon: "Am" },
];

const ANOMALY_TYPES = ["signal", "wreck", "station", "comet", "probe"];

const AI_LINES = {
  startup: [
    "Bridge online. All systems nominal.",
    "Navigation computer calibrated. Awaiting your command, Captain.",
  ],
  sector: [
    "Entering new sector. Scanning local space.",
    "New sector logged. Updating star charts.",
    "Sector boundary crossed. Sensors recalibrating.",
  ],
  scan: [
    "Anomaly scanned. Data recorded.",
    "Scan complete. Adding to mission log.",
    "Signature resolved. Catalogued.",
  ],
  collect: [
    "Resources secured in cargo hold.",
    "Materials aboard. Inventory updated.",
    "Harvest complete.",
  ],
  damage: [
    "Hull impact detected. Assessing damage.",
    "Shields taking fire. Recommend evasive action.",
    "Collision alarm. Hull integrity reduced.",
  ],
  lowFuel: [
    "Fuel reserves below 25%. Recommend conserving thrust.",
    "Reactor fuel low. Plot course to nearest station.",
  ],
  lowO2: [
    "Oxygen levels declining. Life support priority.",
    "Atmospheric reserves below threshold.",
  ],
  checkpoint: [
    "Navigation checkpoint reached. Sector progress updated.",
    "Checkpoint logged. Course to next objective plotted.",
  ],
};

const RADIO_LINES = [
  "Galactic Traffic Control: channel clear, proceed.",
  "STS-7 cargo hauler on approach vector. Mind the lane.",
  "Relay buoy pinged. Telemetry uplink stable.",
  "Unknown vessel on long-range sensors. Holding position.",
  "Solar weather: nominal. No flares expected.",
  "Deep-space telemetry: background radiation within limits.",
  "Outpost Kepler reports all quiet.",
  "Automated beacon sync complete.",
];

/* ============================================================
   Hook: useGameLoop
   Fixed-timestep RAF loop. Calls update(dt) every frame.
   ============================================================ */
function useGameLoop(update) {
  const updateRef = useRef(update);
  updateRef.current = update;

  useEffect(() => {
    let raf;
    let last = performance.now();
    let running = true;
    const frame = (now) => {
      if (!running) return;
      let dt = (now - last) / 1000;
      last = now;
      // Clamp dt to avoid huge jumps on tab-switch
      if (dt > 0.1) dt = 0.1;
      updateRef.current(dt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}

/* ============================================================
   Hook: useInput
   Tracks WASD, Space, wheel. Returns a ref object updated live
   (avoids re-render on every keystroke).
   ============================================================ */
function useInput(enabled) {
  const inputRef = useRef({
    keys: { w: false, a: false, s: false, d: false, space: false },
    wheel: 0, // accumulated wheel delta → zoom
  });

  useEffect(() => {
    if (!enabled) return;
    const input = inputRef.current;

    const isGameKey = (k) =>
      ["w", "a", "s", "d", " "].includes(k.toLowerCase());

    const onKeyDown = (e) => {
      if (!isGameKey(e.key)) return;
      e.preventDefault();
      const k = e.key.toLowerCase();
      if (k === " ") input.keys.space = true;
      else input.keys[k] = true;
    };
    const onKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if (k === " ") input.keys.space = false;
      else if (["w", "a", "s", "d"].includes(k)) input.keys[k] = false;
    };
    const onWheel = (e) => {
      e.preventDefault();
      input.wheel += e.deltaY;
    };
    const onBlur = () => {
      input.keys = { w: false, a: false, s: false, d: false, space: false };
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    const canvasEl = document.querySelector(
      '[data-stellar-canvas="true"]'
    );
    if (canvasEl) {
      canvasEl.addEventListener("wheel", onWheel, { passive: false });
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      if (canvasEl) canvasEl.removeEventListener("wheel", onWheel);
    };
  }, [enabled]);

  return inputRef;
}

/* ============================================================
   Procedural sector generator
   Returns asteroids, planets, stations, anomalies, checkpoints
   ============================================================ */
function generateSector(sectorX, sectorY) {
  const seed =
    ((sectorX + 10000) * 73856093) ^ ((sectorY + 10000) * 19349663);
  const rng = mulberry32(seed >>> 0);

  const asteroids = [];
  const numA = 18 + Math.floor(rng() * 24);
  for (let i = 0; i < numA; i++) {
    asteroids.push({
      x: rand(-SECTOR_SIZE / 2, SECTOR_SIZE / 2),
      y: rand(-SECTOR_SIZE / 2, SECTOR_SIZE / 2),
      r: rand(14, 60),
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.3, 0.3),
      verts: randInt(7, 11),
      shape: Array.from({ length: 11 }, () => rand(0.7, 1.0)),
      vx: rand(-8, 8),
      vy: rand(-8, 8),
    });
  }

  const planets = [];
  const numP = Math.floor(rng() * 2) + (rng() > 0.6 ? 1 : 0);
  for (let i = 0; i < numP; i++) {
    const pal = pick(PLANET_PALETTES);
    planets.push({
      x: rand(-SECTOR_SIZE * 0.4, SECTOR_SIZE * 0.4),
      y: rand(-SECTOR_SIZE * 0.4, SECTOR_SIZE * 0.4),
      r: rand(120, 280),
      pal,
      ringAngle: rng() > 0.5 ? rand(-0.6, 0.6) : null,
      rotation: rand(0, Math.PI * 2),
      name: `${sectorX >= 0 ? "E" : "W"}${Math.abs(sectorX)}-${String.fromCharCode(
        65 + (Math.abs(sectorY) % 26)
      )}${Math.abs(sectorY)}`,
    });
  }

  const stations = [];
  if (rng() > 0.55) {
    stations.push({
      x: rand(-SECTOR_SIZE * 0.3, SECTOR_SIZE * 0.3),
      y: rand(-SECTOR_SIZE * 0.3, SECTOR_SIZE * 0.3),
      r: 28,
      rotation: 0,
      name: `Station ${pick(["Alpha", "Beta", "Gamma", "Delta", "Epsilon"])}-${randInt(
        1,
        99
      )}`,
      visited: false,
    });
  }

  const anomalies = [];
  const numAnom = 2 + Math.floor(rng() * 3);
  for (let i = 0; i < numAnom; i++) {
    anomalies.push({
      id: `${sectorX}_${sectorY}_${i}`,
      x: rand(-SECTOR_SIZE * 0.45, SECTOR_SIZE * 0.45),
      y: rand(-SECTOR_SIZE * 0.45, SECTOR_SIZE * 0.45),
      r: 18,
      type: pick(ANOMALY_TYPES),
      scanned: false,
      pulse: rand(0, Math.PI * 2),
    });
  }

  const resources = [];
  const numRes = 3 + Math.floor(rng() * 4);
  for (let i = 0; i < numRes; i++) {
    resources.push({
      id: `${sectorX}_${sectorY}_r${i}`,
      x: rand(-SECTOR_SIZE * 0.45, SECTOR_SIZE * 0.45),
      y: rand(-SECTOR_SIZE * 0.45, SECTOR_SIZE * 0.45),
      r: 12,
      type: pick(RESOURCE_TYPES),
      collected: false,
      pulse: rand(0, Math.PI * 2),
    });
  }

  const checkpoints = [];
  // Checkpoint placed at sector edge, pointing to next sector
  const dir = Math.floor(rng() * 4);
  const cpPos = [
    { x: 0, y: -SECTOR_SIZE * 0.4 },
    { x: SECTOR_SIZE * 0.4, y: 0 },
    { x: 0, y: SECTOR_SIZE * 0.4 },
    { x: -SECTOR_SIZE * 0.4, y: 0 },
  ][dir];
  checkpoints.push({
    x: cpPos.x,
    y: cpPos.y,
    r: 60,
    reached: false,
    nextSector: { x: sectorX + [0, 1, 0, -1][dir], y: sectorY + [-1, 0, 1, 0][dir] },
  });

  return { asteroids, planets, stations, anomalies, resources, checkpoints };
}

/* ============================================================
   Sub-component: Starfield (CSS parallax background)
   ============================================================ */
function Starfield({ speed, heading }) {
  // Three layers, parallax depth differs
  const layers = useMemo(
    () => [
      { count: 80, size: 1, depth: 0.3, opacity: 0.5 },
      { count: 60, size: 1.5, depth: 0.6, opacity: 0.8 },
      { count: 40, size: 2, depth: 1.0, opacity: 1.0 },
    ],
    []
  );

  return (
    <div className="sn-starfield" aria-hidden="true">
      {layers.map((layer, li) => (
        <div
          key={li}
          className="sn-star-layer"
          data-depth={layer.depth}
          style={{
            opacity: layer.opacity,
            animationDuration: `${Math.max(0.6, 6 - speed * 0.04)}s`,
          }}
        >
          {Array.from({ length: layer.count }).map((_, i) => {
            const x = (i * 37 + li * 191) % 100;
            const y = (i * 53 + li * 127) % 100;
            return (
              <div
                key={i}
                className="sn-star"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${layer.size}px`,
                  height: `${layer.size}px`,
                  animationDelay: `${(i % 10) * 0.3}s`,
                }}
              />
            );
          })}
        </div>
      ))}
      {/* Subtle nebula glow layers */}
      <div className="sn-nebula sn-nebula-1" />
      <div className="sn-nebula sn-nebula-2" />
    </div>
  );
}

/* ============================================================
   Sub-component: SceneCanvas
   Renders all world objects on a 2D canvas. Camera follows ship.
   ============================================================ */
function SceneCanvas({ sceneRef, shipRef, zoomRef, particlesRef }) {
  const canvasRef = useRef(null);
  const sizeRef = useRef({ w: 800, h: 600, dpr: 1 });

  // Resize handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Render loop is driven by parent's RAF; expose draw function via ref
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { w, h, dpr } = sizeRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const ship = shipRef.current;
    const scene = sceneRef.current;
    const zoom = zoomRef.current;
    if (!ship || !scene) return;

    // Camera centered on ship, ship faces "up" (we rotate world instead)
    const cx = w / 2;
    const cy = h * 0.7; // ship sits in lower third

    ctx.save();
    ctx.translate(cx, cy);
    // Rotate world opposite to ship heading so ship visually faces up
    ctx.rotate(-ship.heading - Math.PI / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-ship.x, -ship.y);

    /* --- Planets (background, big) --- */
    if (scene.planets) {
      for (const p of scene.planets) {
        const r = Math.max(1, p.r);
        // Atmosphere
        const atmoGrad = ctx.createRadialGradient(p.x, p.y, r * 0.9, p.x, p.y, r * 1.4);
        atmoGrad.addColorStop(0, p.pal.atmo);
        atmoGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = atmoGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 1.4, 0, Math.PI * 2);
        ctx.fill();

        // Body
        const bodyGrad = ctx.createRadialGradient(
          p.x - r * 0.3,
          p.y - r * 0.3,
          r * 0.1,
          p.x,
          p.y,
          r
        );
        bodyGrad.addColorStop(0, p.pal.core);
        bodyGrad.addColorStop(1, p.pal.rim);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Surface bands (subtle)
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.globalAlpha = 0.15;
        ctx.strokeStyle = p.pal.rim;
        ctx.lineWidth = 2;
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(p.x - r, p.y + i * r * 0.18);
          ctx.lineTo(p.x + r, p.y + i * r * 0.18);
          ctx.stroke();
        }
        ctx.restore();

        // Ring
        if (p.ringAngle !== null) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.ringAngle);
          ctx.scale(1, 0.25);
          ctx.strokeStyle = p.pal.atmo;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    /* --- Stations --- */
    if (scene.stations) {
      for (const s of scene.stations) {
        const r = Math.max(1, s.r);
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);

        // Outer ring
        ctx.strokeStyle = "rgba(160, 200, 255, 0.6)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        // Solar panels
        ctx.fillStyle = "rgba(80, 140, 220, 0.7)";
        ctx.fillRect(-r * 1.4, -4, r * 0.4, 8);
        ctx.fillRect(r * 1.0, -4, r * 0.4, 8);

        // Hub
        const hubGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, r * 0.5);
        hubGrad.addColorStop(0, "#d8e4ff");
        hubGrad.addColorStop(1, "#5a7099");
        ctx.fillStyle = hubGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Blinking lights
        const blink = Math.sin(performance.now() / 400) > 0;
        ctx.fillStyle = blink ? "#ff6a6a" : "rgba(255,106,106,0.2)";
        ctx.beginPath();
        ctx.arc(r * 0.7, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    /* --- Asteroids --- */
    if (scene.asteroids) {
      for (const a of scene.asteroids) {
        const r = Math.max(1, a.r);
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rot);
        ctx.beginPath();
        for (let i = 0; i < a.verts; i++) {
          const ang = (i / a.verts) * Math.PI * 2;
          const rr = r * a.shape[i % a.shape.length];
          const px = Math.cos(ang) * rr;
          const py = Math.sin(ang) * rr;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
        grad.addColorStop(0, "#5a5048");
        grad.addColorStop(1, "#2a2622");
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    }

    /* --- Resources --- */
    if (scene.resources) {
      for (const res of scene.resources) {
        if (res.collected) continue;
        const r = Math.max(1, res.r);
        const pulse = 1 + Math.sin(performance.now() / 300 + res.pulse) * 0.15;
        ctx.save();
        ctx.translate(res.x, res.y);
        ctx.rotate(performance.now() / 1200);
        // Outer glow
        const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2.5 * pulse);
        glow.addColorStop(0, res.type.color + "80");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.5 * pulse, 0, Math.PI * 2);
        ctx.fill();
        // Crystal shape
        ctx.fillStyle = res.type.color;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r, 0);
        ctx.lineTo(0, r);
        ctx.lineTo(-r, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }
    }

    /* --- Anomalies --- */
    if (scene.anomalies) {
      for (const an of scene.anomalies) {
        if (an.scanned) continue;
        const r = Math.max(1, an.r);
        const pulse = (Math.sin(performance.now() / 500 + an.pulse) + 1) / 2;
        ctx.save();
        ctx.translate(an.x, an.y);
        // Question-mark indicator
        ctx.strokeStyle = `rgba(255, 200, 100, ${0.4 + pulse * 0.6})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 200, 100, ${0.4 + pulse * 0.6})`;
        ctx.font = "bold 14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("?", 0, 0);
        ctx.restore();
      }
    }

    /* --- Checkpoints --- */
    if (scene.checkpoints) {
      for (const cp of scene.checkpoints) {
        if (cp.reached) continue;
        const r = Math.max(1, cp.r);
        const pulse = (Math.sin(performance.now() / 600) + 1) / 2;
        ctx.save();
        ctx.translate(cp.x, cp.y);
        // Outer beacon ring
        ctx.strokeStyle = `rgba(120, 255, 180, ${0.3 + pulse * 0.5})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Inner marker
        ctx.fillStyle = `rgba(120, 255, 180, ${0.15 + pulse * 0.25})`;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
        ctx.fill();
        // Diamond marker
        ctx.fillStyle = "#80ffb4";
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(10, 0);
        ctx.lineTo(0, 10);
        ctx.lineTo(-10, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    /* --- Particles (engine trail, debris) --- */
    if (particlesRef.current) {
      const ps = particlesRef.current;
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        const life = p.life / p.maxLife;
        if (life <= 0) continue;
        ctx.save();
        ctx.globalAlpha = life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.r * life), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    /* --- Ship (drawn last, at its world position) --- */
    {
      const r = 18;
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.heading + Math.PI / 2); // align model with heading
      // Engine glow when thrusting
      if (ship.thrusting) {
        const flame = ctx.createRadialGradient(0, r * 1.4, 1, 0, r * 1.4, r * 2.5);
        flame.addColorStop(0, "rgba(120, 200, 255, 0.9)");
        flame.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = flame;
        ctx.beginPath();
        ctx.arc(0, r * 1.4, r * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      // Hull
      const hullGrad = ctx.createLinearGradient(0, -r, 0, r);
      hullGrad.addColorStop(0, "#e8eef8");
      hullGrad.addColorStop(0.5, "#9aabc4");
      hullGrad.addColorStop(1, "#5a6678");
      ctx.fillStyle = hullGrad;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.2);
      ctx.lineTo(r * 0.9, r * 0.8);
      ctx.lineTo(r * 0.3, r);
      ctx.lineTo(-r * 0.3, r);
      ctx.lineTo(-r * 0.9, r * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
      // Cockpit
      const cockpit = ctx.createRadialGradient(0, -r * 0.4, 1, 0, -r * 0.4, r * 0.4);
      cockpit.addColorStop(0, "rgba(140, 220, 255, 0.95)");
      cockpit.addColorStop(1, "rgba(40, 90, 140, 0.6)");
      ctx.fillStyle = cockpit;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.4, r * 0.35, r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wings
      ctx.fillStyle = "#7a8aa0";
      ctx.beginPath();
      ctx.moveTo(r * 0.9, r * 0.8);
      ctx.lineTo(r * 1.4, r * 0.3);
      ctx.lineTo(r * 0.7, r * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-r * 0.9, r * 0.8);
      ctx.lineTo(-r * 1.4, r * 0.3);
      ctx.lineTo(-r * 0.7, r * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }, [sceneRef, shipRef, zoomRef, particlesRef]);

  // Expose draw to parent via ref pattern: parent calls draw via callback
  // We use a small bridge: store draw on the canvas element's dataset via ref
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) canvas.__snDraw = draw;
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="sn-scene-canvas"
      data-stellar-canvas="true"
      aria-label="Space viewport"
    />
  );
}

/* ============================================================
   Sub-component: SystemsPanel
   ============================================================ */
function Bar({ label, value, max, unit, color, status }) {
  const pct = clamp((value / max) * 100, 0, 100);
  return (
    <div className="sn-system-row">
      <div className="sn-system-label">
        <span>{label}</span>
        <span className="sn-system-value">
          {Math.round(value)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <div className="sn-system-bar">
        <div
          className="sn-system-fill"
          style={{
            width: `${pct}%`,
            background: color,
          }}
        />
      </div>
      {status && <div className="sn-system-status">{status}</div>}
    </div>
  );
}

function SystemsPanel({ systems }) {
  return (
    <div className="sn-panel sn-systems">
      <div className="sn-panel-title">Ship Systems</div>
      <Bar
        label="Hull Integrity"
        value={systems.hull}
        max={100}
        unit="%"
        color={
          systems.hull > 60
            ? "linear-gradient(90deg,#5ad4a0,#7affaa)"
            : systems.hull > 30
            ? "linear-gradient(90deg,#f5d030,#ffd470)"
            : "linear-gradient(90deg,#f03030,#ff6a6a)"
        }
      />
      <Bar
        label="Shield Strength"
        value={systems.shield}
        max={100}
        unit="%"
        color="linear-gradient(90deg,#5ad4ff,#7ab8ff)"
      />
      <Bar
        label="Fuel"
        value={systems.fuel}
        max={100}
        unit="%"
        color={
          systems.fuel > 25
            ? "linear-gradient(90deg,#ffd470,#f5d030)"
            : "linear-gradient(90deg,#f03030,#ff6a6a)"
        }
        status={systems.fuel < 25 ? "LOW" : null}
      />
      <Bar
        label="Oxygen"
        value={systems.oxygen}
        max={100}
        unit="%"
        color="linear-gradient(90deg,#80ffb4,#5ad4a0)"
        status={systems.oxygen < 25 ? "LOW" : null}
      />
      <Bar
        label="Reactor Output"
        value={systems.reactor}
        max={100}
        unit="%"
        color="linear-gradient(90deg,#b46aff,#d46aff)"
      />
      <div className="sn-system-row">
        <div className="sn-system-label">
          <span>Navigation Status</span>
          <span className="sn-system-value">{systems.navStatus}</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Sub-component: NavMap (top-down sector minimap)
   ============================================================ */
function NavMap({ shipRef, sceneRef, sector }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = "rgba(10, 14, 26, 0.6)";
      ctx.fillRect(0, 0, w, h);

      // Sector grid
      ctx.strokeStyle = "rgba(120, 180, 255, 0.15)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo((i / 4) * w, 0);
        ctx.lineTo((i / 4) * w, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, (i / 4) * h);
        ctx.lineTo(w, (i / 4) * h);
        ctx.stroke();
      }

      const ship = shipRef.current;
      const scene = sceneRef.current;
      if (!ship || !scene) return;

      const scale = w / SECTOR_SIZE;
      const toMapX = (x) => w / 2 + x * scale;
      const toMapY = (y) => h / 2 + y * scale;

      // Planets
      for (const p of scene.planets || []) {
        ctx.fillStyle = p.pal.core;
        ctx.beginPath();
        ctx.arc(toMapX(p.x), toMapY(p.y), Math.max(2, p.r * scale * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }

      // Stations
      for (const s of scene.stations || []) {
        ctx.fillStyle = "#a0c8ff";
        ctx.fillRect(toMapX(s.x) - 2, toMapY(s.y) - 2, 4, 4);
      }

      // Resources
      for (const r of scene.resources || []) {
        if (r.collected) continue;
        ctx.fillStyle = r.type.color;
        ctx.beginPath();
        ctx.arc(toMapX(r.x), toMapY(r.y), 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Anomalies
      for (const a of scene.anomalies || []) {
        if (a.scanned) continue;
        ctx.strokeStyle = "#ffc864";
        ctx.beginPath();
        ctx.arc(toMapX(a.x), toMapY(a.y), 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Checkpoints
      for (const c of scene.checkpoints || []) {
        if (c.reached) continue;
        ctx.fillStyle = "#80ffb4";
        ctx.beginPath();
        ctx.arc(toMapX(c.x), toMapY(c.y), 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Asteroids (faint)
      ctx.fillStyle = "rgba(140, 120, 100, 0.4)";
      for (const a of scene.asteroids || []) {
        ctx.beginPath();
        ctx.arc(toMapX(a.x), toMapY(a.y), 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ship
      const sx = toMapX(ship.x);
      const sy = toMapY(ship.y);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(ship.heading + Math.PI / 2);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(3, 4);
      ctx.lineTo(-3, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Sector label
      ctx.fillStyle = "rgba(200, 220, 255, 0.7)";
      ctx.font = "9px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`SECTOR ${sector.x},${sector.y}`, 4, 11);

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [shipRef, sceneRef, sector]);

  return (
    <div className="sn-panel sn-navmap">
      <div className="sn-panel-title">Navigation Map</div>
      <canvas ref={canvasRef} width={180} height={180} className="sn-navmap-canvas" />
    </div>
  );
}

/* ============================================================
   Sub-component: Radar (real-time nearby objects)
   ============================================================ */
function Radar({ shipRef, sceneRef }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const range = WORLD.radarRange;
      const scale = (w / 2) / range;

      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = "rgba(10, 14, 26, 0.7)";
      ctx.beginPath();
      ctx.arc(cx, cy, w / 2, 0, Math.PI * 2);
      ctx.fill();

      // Range rings
      ctx.strokeStyle = "rgba(120, 200, 255, 0.2)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (i / 3) * (w / 2), 0, Math.PI * 2);
        ctx.stroke();
      }
      // Crosshair
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();

      // Sweep
      const sweepAng = (performance.now() / 1500) % (Math.PI * 2);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(sweepAng);
      const sg = ctx.createLinearGradient(0, 0, w / 2, 0);
      sg.addColorStop(0, "rgba(120, 255, 180, 0.35)");
      sg.addColorStop(1, "rgba(120, 255, 180, 0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, w / 2, -0.1, 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      const ship = shipRef.current;
      const scene = sceneRef.current;
      if (ship && scene) {
        const drawBlip = (obj, color, size = 2) => {
          const dx = obj.x - ship.x;
          const dy = obj.y - ship.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > range) return;
          // Rotate by -heading so forward is up
          const cos = Math.cos(-ship.heading - Math.PI / 2);
          const sin = Math.sin(-ship.heading - Math.PI / 2);
          const rx = dx * cos - dy * sin;
          const ry = dx * sin + dy * cos;
          const px = cx + rx * scale;
          const py = cy + ry * scale;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
        };

        for (const a of scene.asteroids || []) drawBlip(a, "rgba(180, 150, 120, 0.7)", 1.5);
        for (const r of scene.resources || []) {
          if (!r.collected) drawBlip(r, r.type.color, 2.5);
        }
        for (const a of scene.anomalies || []) {
          if (!a.scanned) drawBlip(a, "#ffc864", 2.5);
        }
        for (const s of scene.stations || []) drawBlip(s, "#a0c8ff", 3);
        for (const c of scene.checkpoints || []) {
          if (!c.reached) drawBlip(c, "#80ffb4", 3.5);
        }
        for (const p of scene.planets || []) drawBlip(p, p.pal.core, 4);
      }

      // Ship at center
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(cx, cy - 5);
      ctx.lineTo(cx + 3, cy + 3);
      ctx.lineTo(cx - 3, cy + 3);
      ctx.closePath();
      ctx.fill();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [shipRef, sceneRef]);

  return (
    <div className="sn-panel sn-radar">
      <div className="sn-panel-title">Radar Scanner</div>
      <canvas ref={canvasRef} width={140} height={140} className="sn-radar-canvas" />
    </div>
  );
}

/* ============================================================
   Sub-component: MissionLog
   ============================================================ */
function MissionLog({ entries }) {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="sn-panel sn-mission-log">
      <div className="sn-panel-title">Mission Log</div>
      <div className="sn-log-list" ref={scrollRef}>
        {entries.length === 0 && (
          <div className="sn-log-empty">No mission entries yet.</div>
        )}
        {entries.map((e) => (
          <div key={e.id} className={`sn-log-entry sn-log-${e.kind}`}>
            <span className="sn-log-time">{e.time}</span>
            <span className="sn-log-text">{e.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Sub-component: Inventory
   ============================================================ */
function Inventory({ resources }) {
  const total = Object.values(resources).reduce((s, v) => s + v, 0);
  return (
    <div className="sn-panel sn-inventory">
      <div className="sn-panel-title">Resource Inventory</div>
      <div className="sn-inventory-list">
        {RESOURCE_TYPES.map((t) => (
          <div key={t.id} className="sn-inventory-row">
            <span className="sn-inventory-icon" style={{ color: t.color }}>
              {t.icon}
            </span>
            <span className="sn-inventory-name">{t.name}</span>
            <span className="sn-inventory-count">{resources[t.id] || 0}</span>
          </div>
        ))}
        <div className="sn-inventory-total">
          Total cargo: {total} units
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Sub-component: Hud (top status bar)
   ============================================================ */
function Hud({ ship, sector, autopilot, alert, aiMessage }) {
  const speed = Math.round(Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy));
  const headingDeg = Math.round(((ship.heading * 180) / Math.PI + 360) % 360);

  return (
    <>
      {/* Top HUD bar */}
      <div className="sn-hud-top">
        <div className="sn-hud-left">
          <div className="sn-hud-block">
            <div className="sn-hud-label">Sector</div>
            <div className="sn-hud-value">
              {sector.x}, {sector.y}
            </div>
          </div>
          <div className="sn-hud-block">
            <div className="sn-hud-label">Heading</div>
            <div className="sn-hud-value">{String(headingDeg).padStart(3, "0")}°</div>
          </div>
          <div className="sn-hud-block">
            <div className="sn-hud-label">Speed</div>
            <div className="sn-hud-value">
              {speed} <span className="sn-hud-unit">u/s</span>
            </div>
          </div>
        </div>
        <div className="sn-hud-center">
          {alert && <div className={`sn-alert sn-alert-${alert.level}`}>{alert.text}</div>}
        </div>
        <div className="sn-hud-right">
          {autopilot && (
            <div className="sn-autopilot-badge">AUTO-PILOT ENGAGED</div>
          )}
        </div>
      </div>

      {/* AI comm line */}
      {aiMessage && (
        <div className="sn-ai-comm">
          <span className="sn-ai-label">SHIP AI</span>
          <span className="sn-ai-text">{aiMessage}</span>
        </div>
      )}

      {/* Bottom controls hint */}
      <div className="sn-hud-bottom">
        <span><kbd>W</kbd> Thrust</span>
        <span><kbd>S</kbd> Brake</span>
        <span><kbd>A</kbd>/<kbd>D</kbd> Rotate</span>
        <span><kbd>Space</kbd> Boost</span>
        <span><kbd>Wheel</kbd> Zoom</span>
      </div>
    </>
  );
}

/* ============================================================
   Root: StellarNavigation
   ============================================================ */
export default function StellarNavigation() {
  const shipRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    heading: 0, // 0 = pointing up (-y)
    thrusting: false,
  });
  const sceneRef = useRef(null);
  const zoomRef = useRef(1.0);
  const particlesRef = useRef([]);
  const aiMessageTimerRef = useRef(null);
  const lastAiMessageRef = useRef("");
  const lastHudUpdateRef = useRef(0);

  /* ----- React state (UI updates, throttled) ----- */
  const [sector, setSector] = useState({ x: 0, y: 0 });
  const [systems, setSystems] = useState({
    hull: 100,
    shield: 100,
    fuel: 100,
    oxygen: 100,
    reactor: 100,
    navStatus: "STANDBY",
  });
  // Mirror systems into a ref so the game loop can read latest values
  // synchronously without re-subscribing every render.
  const systemsRef = useRef(systems);
  useEffect(() => {
    systemsRef.current = systems;
  }, [systems]);
  const [logEntries, setLogEntries] = useState([]);
  const [inventory, setInventory] = useState({});
  const [autopilot, setAutopilot] = useState(false);
  const [alert, setAlert] = useState(null);
  const [aiMessage, setAiMessage] = useState("");
  const [started, setStarted] = useState(false);
  const [hudShip, setHudShip] = useState({ vx: 0, vy: 0, heading: 0 });

  const inputRef = useInput(started);

  /* ----- Add log entry ----- */
  const addLog = useCallback((text, kind = "info") => {
    setLogEntries((prev) => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes()
      ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
      const entry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        time,
        text,
        kind,
      };
      const next = [...prev, entry];
      return next.length > 50 ? next.slice(next.length - 50) : next;
    });
  }, []);

  /* ----- AI comm ----- */
  const speakAi = useCallback(
    (category) => {
      const lines = AI_LINES[category];
      if (!lines || lines.length === 0) return;
      const line = pick(lines);
      if (line === lastAiMessageRef.current) return;
      lastAiMessageRef.current = line;
      setAiMessage(line);
      if (aiMessageTimerRef.current) clearTimeout(aiMessageTimerRef.current);
      aiMessageTimerRef.current = setTimeout(() => setAiMessage(""), 5000);
      addLog(`[AI] ${line}`, "ai");
    },
    [addLog]
  );

  /* ----- Alert helper ----- */
  const showAlert = useCallback((text, level = "warning", duration = 4000) => {
    setAlert({ text, level });
    setTimeout(() => {
      setAlert((cur) => (cur && cur.text === text ? null : cur));
    }, duration);
  }, []);

  /* ----- Initialize sector ----- */
  const loadSector = useCallback(
    (sx, sy) => {
      const scene = generateSector(sx, sy);
      sceneRef.current = scene;
      setSector({ x: sx, y: sy });
      addLog(`Entered sector ${sx},${sy}.`, "sector");
      speakAi("sector");
    },
    [addLog, speakAi]
  );

  /* ----- Start mission ----- */
  const startMission = useCallback(() => {
    setStarted(true);
    loadSector(0, 0);
    addLog("Mission start. Bridge online.", "info");
    speakAi("startup");
    setSystems((s) => ({ ...s, navStatus: "ACTIVE" }));
  }, [loadSector, addLog, speakAi]);

  /* ----- Radio chatter (random) ----- */
  useEffect(() => {
    if (!started) return;
    const id = setInterval(() => {
      if (Math.random() < 0.4) {
        const line = pick(RADIO_LINES);
        addLog(`[RADIO] ${line}`, "radio");
      }
    }, 25000);
    return () => clearInterval(id);
  }, [started, addLog]);

  /* ----- Ambient particle updates for ship trail ----- */
  const spawnTrailParticle = useCallback((ship) => {
    if (!ship.thrusting) return;
    const back = ship.heading + Math.PI;
    const px = ship.x + Math.cos(back) * 18;
    const py = ship.y + Math.sin(back) * 18;
    if (particlesRef.current.length > 120) particlesRef.current.shift();
    particlesRef.current.push({
      x: px + rand(-2, 2),
      y: py + rand(-2, 2),
      vx: Math.cos(back) * rand(20, 60) + ship.vx * 0.2,
      vy: Math.sin(back) * rand(20, 60) + ship.vy * 0.2,
      r: rand(1.5, 3),
      life: 1.0,
      maxLife: rand(0.3, 0.6),
      color: Math.random() > 0.5 ? "#7ad4ff" : "#a0e4ff",
      age: 0,
    });
  }, []);

  /* ----- Main update loop ----- */
  useGameLoop((dt) => {
    if (!started || !sceneRef.current) return;
    const ship = shipRef.current;
    const scene = sceneRef.current;
    const input = inputRef.current;

    /* --- Autopilot: head to nearest checkpoint --- */
    if (autopilot) {
      const cp = (scene.checkpoints || []).find((c) => !c.reached);
      if (cp) {
        const dx = cp.x - ship.x;
        const dy = cp.y - ship.y;
        const targetAng = Math.atan2(dy, dx);
        let diff = targetAng - ship.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        ship.heading += clamp(diff, -WORLD.rotateRate * dt, WORLD.rotateRate * dt);
        input.keys.w = Math.abs(diff) < 0.5;
      }
    }

    /* --- Input → rotation --- */
    if (!autopilot) {
      if (input.keys.a) ship.heading -= WORLD.rotateRate * dt;
      if (input.keys.d) ship.heading += WORLD.rotateRate * dt;
    }

    /* --- Input → thrust --- */
    const sys = systemsRef.current;
    const boosting = input.keys.space && sys.fuel > 0;
    const wantThrust = (input.keys.w || (autopilot && input.keys.w)) && sys.fuel > 0;
    ship.thrusting = wantThrust || boosting;
    if (wantThrust) {
      const acc = WORLD.accelRate * (boosting ? WORLD.boostMultiplier : 1);
      ship.vx += Math.cos(ship.heading) * acc * dt;
      ship.vy += Math.sin(ship.heading) * acc * dt;
    }
    if (input.keys.s) {
      const sp = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
      if (sp > 0.1) {
        const decel = WORLD.brakeRate * dt;
        const f = Math.max(0, sp - decel) / sp;
        ship.vx *= f;
        ship.vy *= f;
      }
    }

    /* --- Clamp max speed --- */
    const sp = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
    const maxSp = WORLD.maxSpeed * (boosting ? WORLD.boostMultiplier : 1);
    if (sp > maxSp) {
      ship.vx = (ship.vx / sp) * maxSp;
      ship.vy = (ship.vy / sp) * maxSp;
    }

    /* --- Move ship --- */
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    /* --- Move asteroids --- */
    for (const a of scene.asteroids || []) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rot += a.rotSpeed * dt;
      // Wrap within sector
      const half = SECTOR_SIZE / 2;
      if (a.x < -half) a.x = half;
      if (a.x > half) a.x = -half;
      if (a.y < -half) a.y = half;
      if (a.y > half) a.y = -half;
    }

    /* --- Move particles --- */
    const ps = particlesRef.current;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.age += dt;
      p.life = 1 - p.age / p.maxLife;
      if (p.life <= 0) ps.splice(i, 1);
    }
    if (ship.thrusting && Math.random() < 0.7) spawnTrailParticle(ship);

    /* --- Zoom via wheel --- */
    if (input.wheel !== 0) {
      zoomRef.current = clamp(
        zoomRef.current * (input.wheel > 0 ? 0.95 : 1.05),
        0.4,
        2.5
      );
      input.wheel = 0;
    }

    /* --- Collisions: asteroids --- */
    let damageThisFrame = 0;
    for (const a of scene.asteroids || []) {
      const rr = a.r + 14;
      if (dist2(ship.x, ship.y, a.x, a.y) < rr * rr) {
        // Bounce ship back
        const dx = ship.x - a.x;
        const dy = ship.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / d;
        const ny = dy / d;
        ship.x = a.x + nx * rr;
        ship.y = a.y + ny * rr;
        // Reflect velocity
        const vdotn = ship.vx * nx + ship.vy * ny;
        ship.vx -= 1.6 * vdotn * nx;
        ship.vy -= 1.6 * vdotn * ny;
        damageThisFrame += WORLD.collisionDamage;
        // Spawn debris particles
        for (let i = 0; i < 8; i++) {
          ps.push({
            x: a.x + rand(-a.r, a.r),
            y: a.y + rand(-a.r, a.r),
            vx: rand(-80, 80),
            vy: rand(-80, 80),
            r: rand(1, 3),
            life: 1,
            maxLife: rand(0.4, 0.8),
            age: 0,
            color: "#7a6a5a",
          });
        }
      }
    }

    /* --- Pick up resources --- */
    for (const r of scene.resources || []) {
      if (r.collected) continue;
      const rr = r.r + 16;
      if (dist2(ship.x, ship.y, r.x, r.y) < rr * rr) {
        r.collected = true;
        setInventory((inv) => ({
          ...inv,
          [r.type.id]: (inv[r.type.id] || 0) + 1,
        }));
        addLog(`Collected 1 unit of ${r.type.name}.`, "collect");
        speakAi("collect");
      }
    }

    /* --- Scan anomalies (close pass) --- */
    for (const a of scene.anomalies || []) {
      if (a.scanned) continue;
      const rr = WORLD.scanRange * 0.35 + a.r;
      if (dist2(ship.x, ship.y, a.x, a.y) < rr * rr) {
        a.scanned = true;
        addLog(`Scanned anomaly: ${a.type}.`, "scan");
        speakAi("scan");
      }
    }

    /* --- Visit stations --- */
    for (const s of scene.stations || []) {
      if (s.visited) continue;
      const rr = s.r + 24;
      if (dist2(ship.x, ship.y, s.x, s.y) < rr * rr) {
        s.visited = true;
        addLog(`Docked at ${s.name}. Resupplied.`, "station");
        // Refuel + restore (computed from latest sys ref)
        systemsRef.current = {
          ...systemsRef.current,
          fuel: 100,
          oxygen: 100,
          hull: Math.min(100, systemsRef.current.hull + 25),
          shield: 100,
        };
        setSystems(systemsRef.current);
      }
    }

    /* --- Checkpoints --- */
    for (const c of scene.checkpoints || []) {
      if (c.reached) continue;
      const rr = c.r + 20;
      if (dist2(ship.x, ship.y, c.x, c.y) < rr * rr) {
        c.reached = true;
        addLog(`Checkpoint reached. Plotting course to next sector.`, "checkpoint");
        speakAi("checkpoint");
        // Add new checkpoint in next sector direction
        setTimeout(() => {
          loadSector(c.nextSector.x, c.nextSector.y);
        }, 1500);
      }
    }

    /* --- Rotate station visuals --- */
    for (const s of scene.stations || []) {
      s.rotation = (s.rotation || 0) + dt * 0.3;
    }

    /* --- Systems updates (computed synchronously, single setState) --- */
    {
      const prev = systemsRef.current;
      let fuelBurn = 0;
      if (wantThrust) fuelBurn += WORLD.fuelBurnPerSec * dt;
      if (boosting) fuelBurn += WORLD.fuelBurnBoost * dt;
      const next = {
        hull: clamp(prev.hull - damageThisFrame + WORLD.hullRegenPerSec * dt, 0, 100),
        shield: clamp(
          prev.shield - damageThisFrame * 0.6 + WORLD.shieldRegenPerSec * dt,
          0,
          100
        ),
        fuel: clamp(prev.fuel - fuelBurn, 0, 100),
        oxygen: clamp(prev.oxygen - WORLD.o2DrainPerSec * dt, 0, 100),
        reactor: clamp(
          prev.reactor - WORLD.reactorDrainPerSec * dt + (boosting ? 0 : dt * 0.3),
          0,
          100
        ),
        navStatus: prev.navStatus,
      };
      systemsRef.current = next;
      setSystems(next);

      // Side effects OUTSIDE the setState updater — React-safe
      if (next.fuel < 25 && prev.fuel >= 25) {
        speakAi("lowFuel");
        showAlert("Low fuel — conserve thrust.", "warning", 5000);
      }
      if (next.oxygen < 25 && prev.oxygen >= 25) {
        speakAi("lowO2");
        showAlert("Oxygen low — life support priority.", "danger", 5000);
      }
      if (next.hull < 30 && prev.hull >= 30) {
        showAlert("Hull critical — seek repairs.", "danger", 5000);
      }
      if (damageThisFrame > 0) {
        speakAi("damage");
        showAlert("Hull impact!", "danger", 2500);
      }
    }

    /* --- Random events --- */
    if (Math.random() < dt * 0.01) {
      const eventType = pick(["storm", "flare", "distress", "unknown"]);
      if (eventType === "storm") {
        addLog("WARNING: Asteroid storm detected nearby.", "event");
        showAlert("Asteroid storm — brace for debris.", "warning", 5000);
      } else if (eventType === "flare") {
        addLog("Solar flare detected. Shields holding.", "event");
        showAlert("Solar flare — shields stressed.", "warning", 4000);
        systemsRef.current = {
          ...systemsRef.current,
          shield: clamp(systemsRef.current.shield - 10, 0, 100),
        };
        setSystems(systemsRef.current);
      } else if (eventType === "distress") {
        addLog("Distress signal received from bearing 045.", "event");
        showAlert("Distress signal on comms.", "info", 4000);
      } else {
        addLog("Unknown object on long-range sensors.", "event");
        showAlert("Unknown object detected.", "info", 4000);
      }
    }

    /* --- Draw scene via canvas bridge --- */
    const canvasEl = document.querySelector('[data-stellar-canvas="true"]');
    if (canvasEl && canvasEl.__snDraw) canvasEl.__snDraw();

    /* --- Throttled HUD updates (every ~100ms) --- */
    if (performance.now() - lastHudUpdateRef.current > 100) {
      lastHudUpdateRef.current = performance.now();
      setHudShip({
        vx: ship.vx,
        vy: ship.vy,
        heading: ship.heading,
      });
    }
  });

  /* ----- Cleanup ----- */
  useEffect(() => {
    return () => {
      if (aiMessageTimerRef.current) clearTimeout(aiMessageTimerRef.current);
    };
  }, []);

  /* ----- Toggle autopilot ----- */
  // Keep a live mirror of autopilot so toggleAutopilot can read current value
  // without re-creating the callback every time the state changes.
  const autoRef = useRef(false);
  useEffect(() => {
    autoRef.current = autopilot;
  }, [autopilot]);

  const toggleAutopilot = useCallback(() => {
    setAutopilot((a) => !a);
    // Side effect runs after state update is queued — safe.
    addLog(autoRef.current ? "Auto-pilot disengaged." : "Auto-pilot engaged.", "info");
  }, [addLog]);

  /* ----- Keyboard shortcut: P to toggle autopilot ----- */
  useEffect(() => {
    if (!started) return;
    const onKey = (e) => {
      if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        toggleAutopilot();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, toggleAutopilot]);

  if (!started) {
    return (
      <div className="stellar-navigation sn-start-screen">
        <div className="sn-start-content">
          <div className="sn-start-logo">STELLAR NAVIGATION</div>
          <div className="sn-start-subtitle">Deep-Space Bridge Simulator</div>
          <div className="sn-start-description">
            You are the Captain of the NovaOS exploratory vessel. Navigate deep
            space, scan anomalies, harvest resources, and reach distant
            checkpoints across uncharted sectors.
          </div>
          <div className="sn-start-controls">
            <div className="sn-start-controls-title">Flight Controls</div>
            <div className="sn-start-controls-grid">
              <div><kbd>W</kbd> Accelerate</div>
              <div><kbd>S</kbd> Brake</div>
              <div><kbd>A</kbd> Rotate left</div>
              <div><kbd>D</kbd> Rotate right</div>
              <div><kbd>Space</kbd> Boost</div>
              <div><kbd>Wheel</kbd> Zoom</div>
              <div><kbd>P</kbd> Auto-pilot</div>
            </div>
          </div>
          <button className="sn-start-button" onClick={startMission}>
            INITIATE LAUNCH SEQUENCE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stellar-navigation" tabIndex={-1}>
      {/* CSS parallax starfield */}
      <Starfield
        speed={Math.sqrt(hudShip.vx * hudShip.vx + hudShip.vy * hudShip.vy)}
        heading={hudShip.heading}
      />

      {/* Canvas scene */}
      <SceneCanvas
        sceneRef={sceneRef}
        shipRef={shipRef}
        zoomRef={zoomRef}
        particlesRef={particlesRef}
      />

      {/* Cockpit vignette */}
      <div className="sn-cockpit-vignette" aria-hidden="true" />
      <div className="sn-scanlines" aria-hidden="true" />

      {/* HUD */}
      <Hud
        ship={hudShip}
        sector={sector}
        autopilot={autopilot}
        alert={alert}
        aiMessage={aiMessage}
      />

      {/* Left column panels */}
      <div className="sn-panel-col sn-panel-col-left">
        <SystemsPanel systems={systems} />
        <Inventory resources={inventory} />
      </div>

      {/* Right column panels */}
      <div className="sn-panel-col sn-panel-col-right">
        <NavMap shipRef={shipRef} sceneRef={sceneRef} sector={sector} />
        <Radar shipRef={shipRef} sceneRef={sceneRef} />
        <MissionLog entries={logEntries} />
      </div>

      {/* Bottom action bar */}
      <div className="sn-action-bar">
        <button
          className={`sn-action-button ${autopilot ? "active" : ""}`}
          onClick={toggleAutopilot}
          title="Toggle auto-pilot (P)"
        >
          {autopilot ? "DISENGAGE AUTO-PILOT" : "ENGAGE AUTO-PILOT"}
        </button>
        <div className="sn-action-info">
          Click anywhere on the viewport to focus. Use W/A/S/D to fly.
        </div>
      </div>
    </div>
  );
}
