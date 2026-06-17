import { useEffect, useState, useRef, useCallback } from "react";

/* ============================================================
   AlienPet — NovaOS Crew Companion
   A premium desktop pet: cursor-tracking eyes, patrol walks,
   speech bubbles, app reactions, moods, idle sleep, XP/level,
   loot discoveries, and petting interactions.
   ============================================================ */

const RANDOM_MESSAGES = [
  "Captain, on duty.",
  "Ship status nominal.",
  "Need space pizza.",
  "Scanning nearby sectors.",
  "No hostiles detected.",
  "I found a bolt.",
  "The engines sound happy.",
  "Something shiny over there.",
  "Orbit looks clear, sir.",
  "All systems green.",
  "Requesting shore leave.",
  "Hull integrity: 100%.",
  "Awaiting orders.",
  "Fuel cells optimal.",
  "Radar sweep complete.",
  "Stars look nice today.",
  "Spotted a meteor.",
  "Standing by.",
];

const RANDOM_LOOT = [
  "Alien Crystal",
  "Battery Cell",
  "Scrap Metal",
  "Navigation Chip",
  "Space Pizza Coupon",
  "Stardust Vial",
  "Quantum Fuse",
  "Cosmic Gem",
  "Warp Core Fragment",
];

const APP_REACTIONS = {
  novaOpen: [
    "Ooh, talking to Nova AI?",
    "AI core online, sir.",
    "Nova's chatty today.",
  ],
  explorerOpen: [
    "Rummaging through files?",
    "Many folders. Many.",
    "Found something good?",
  ],
  musicOpen: [
    "Ooh, tunes!",
    "Tap the beat, Captain.",
    "I love this track.",
  ],
  settingsOpen: [
    "Tuning the ship?",
    "Careful with those knobs.",
    "Settings are serious business.",
  ],
};

const PET_REACTIONS = [
  "Greetings, Captain.",
  "Hello there!",
  "Ack ack!",
  "At your service.",
  "Salutations!",
];

/* Pet sits just above the taskbar */
const TASKBAR_HEIGHT = 56;
const PET_VERTICAL_OFFSET = 18;

/* Helper: safely read window dimensions (client-only) */
const getViewportWidth = () =>
  typeof window !== "undefined" ? window.innerWidth : 1920;
const getViewportHeight = () =>
  typeof window !== "undefined" ? window.innerHeight : 1080;

export default function AlienPet({
  musicOpen,
  novaOpen,
  explorerOpen,
  settingsOpen,
}) {
  /* -------- State -------- */
  const [message, setMessage] = useState("");
  const [walking, setWalking] = useState(false);
  const [wave, setWave] = useState(false);
  const [xp, setXp] = useState(0);
  const [x, setX] = useState(220);
  const [sleeping, setSleeping] = useState(false);
  const [mood, setMood] = useState("happy");
  const [mouse, setMouse] = useState(() => ({
    x: getViewportWidth() / 2,
    y: getViewportHeight() / 2,
  }));
  const [clicks, setClicks] = useState(0);
  const [lootFound, setLootFound] = useState(null);
  const [leveledUp, setLeveledUp] = useState(false);

  /* Derived level (no state needed) */
  const level = Math.floor(xp / 100) + 1;

  /* -------- Refs -------- */
  const lastMoveRef = useRef(0);
  const msgTimerRef = useRef(null);
  const angerResetRef = useRef(null);
  const walkEndTimerRef = useRef(null);
  const waveEndTimerRef = useRef(null);
  const lootEndTimerRef = useRef(null);
  const levelEndTimerRef = useRef(null);
  const petRef = useRef(null);
  const prevLevelRef = useRef(level);
  const prevAppsRef = useRef({
    novaOpen: false,
    explorerOpen: false,
    musicOpen: false,
    settingsOpen: false,
  });

  /* -------- Helpers -------- */
  const showMessage = useCallback((msg, duration = 5000) => {
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    setMessage(msg);
    msgTimerRef.current = setTimeout(() => setMessage(""), duration);
  }, []);

  /* -------- Level-up detection -------- */
  useEffect(() => {
    if (level > prevLevelRef.current) {
      setLeveledUp(true);
      showMessage(`Level up! Now Lv.${level}.`, 5000);
      if (levelEndTimerRef.current) clearTimeout(levelEndTimerRef.current);
      levelEndTimerRef.current = setTimeout(() => setLeveledUp(false), 4000);
    }
    prevLevelRef.current = level;
  }, [level, showMessage]);

  /* -------- App open reactions -------- */
  useEffect(() => {
    const prev = prevAppsRef.current;
    let triggered = null;
    if (novaOpen && !prev.novaOpen) triggered = "novaOpen";
    else if (explorerOpen && !prev.explorerOpen) triggered = "explorerOpen";
    else if (musicOpen && !prev.musicOpen) triggered = "musicOpen";
    else if (settingsOpen && !prev.settingsOpen) triggered = "settingsOpen";

    if (triggered && !sleeping) {
      const msgs = APP_REACTIONS[triggered];
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      showMessage(msg);
      setMood("curious");
    }
    prevAppsRef.current = { novaOpen, explorerOpen, musicOpen, settingsOpen };
  }, [novaOpen, explorerOpen, musicOpen, settingsOpen, sleeping, showMessage]);

  /* -------- Mouse tracking + wake-on-move -------- */
  useEffect(() => {
    const onMove = (e) => {
      setMouse({ x: e.clientX, y: e.clientY });
      lastMoveRef.current = Date.now();
      if (sleeping) {
        setSleeping(false);
        setMood("happy");
        showMessage("Oh! You're back, Captain.");
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [sleeping, showMessage]);

  /* -------- Idle / sleep detection (20s inactivity) -------- */
  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - lastMoveRef.current > 20000 && !sleeping) {
        setSleeping(true);
        setMood("sleepy");
        showMessage("Zzz... standing by.", 60000);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [sleeping, showMessage]);

  /* -------- Random speech every 20–30s -------- */
  useEffect(() => {
    const getDelay = () => 20000 + Math.random() * 10000;
    let id;
    const schedule = () => {
      id = setTimeout(() => {
        if (!sleeping) {
          const msg =
            RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)];
          showMessage(msg);
        }
        schedule();
      }, getDelay());
    };
    schedule();
    return () => clearTimeout(id);
  }, [sleeping, showMessage]);

  /* -------- Walking patrol along the taskbar -------- */
  useEffect(() => {
    const id = setInterval(() => {
      if (!sleeping) {
        setWalking(true);
        const margin = 120;
        const w = getViewportWidth();
        const maxX = Math.max(margin * 2 + 100, w - margin);
        const newX = margin + Math.random() * (maxX - margin);
        setX(newX);
        if (walkEndTimerRef.current) clearTimeout(walkEndTimerRef.current);
        walkEndTimerRef.current = setTimeout(() => setWalking(false), 4500);
      }
    }, 28000);
    return () => {
      clearInterval(id);
      if (walkEndTimerRef.current) clearTimeout(walkEndTimerRef.current);
    };
  }, [sleeping]);

  /* -------- Loot discovery (every 45s, 35% chance) -------- */
  useEffect(() => {
    const id = setInterval(() => {
      if (!sleeping && Math.random() < 0.35) {
        const item =
          RANDOM_LOOT[Math.floor(Math.random() * RANDOM_LOOT.length)];
        setLootFound(item);
        showMessage(`Discovered: ${item}!`);
        setXp((v) => v + 5);
        if (lootEndTimerRef.current) clearTimeout(lootEndTimerRef.current);
        lootEndTimerRef.current = setTimeout(() => setLootFound(null), 6000);
      }
    }, 45000);
    return () => {
      clearInterval(id);
      if (lootEndTimerRef.current) clearTimeout(lootEndTimerRef.current);
    };
  }, [sleeping, showMessage]);

  /* -------- Cleanup all timers on unmount -------- */
  useEffect(() => {
    return () => {
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
      if (angerResetRef.current) clearTimeout(angerResetRef.current);
      if (walkEndTimerRef.current) clearTimeout(walkEndTimerRef.current);
      if (waveEndTimerRef.current) clearTimeout(waveEndTimerRef.current);
      if (lootEndTimerRef.current) clearTimeout(lootEndTimerRef.current);
      if (levelEndTimerRef.current) clearTimeout(levelEndTimerRef.current);
    };
  }, []);

  /* -------- Active mood (app reactions can override base mood) -------- */
  const activeMood = sleeping
    ? "sleepy"
    : mood === "angry"
    ? "angry"
    : musicOpen
    ? "excited"
    : novaOpen || explorerOpen || settingsOpen
    ? "curious"
    : mood;

  /* -------- Petting interaction -------- */
  const petAlien = useCallback(() => {
    if (sleeping) {
      setSleeping(false);
      setMood("happy");
      showMessage("Wh— I was not sleeping!");
      return;
    }

    const newClicks = clicks + 1;
    setClicks(newClicks);
    setXp((v) => v + 10);
    setWave(true);
    if (waveEndTimerRef.current) clearTimeout(waveEndTimerRef.current);
    waveEndTimerRef.current = setTimeout(() => setWave(false), 1300);

    if (newClicks > 8) {
      setMood("angry");
      showMessage("STOP. POKING. ME.");
      if (angerResetRef.current) clearTimeout(angerResetRef.current);
      angerResetRef.current = setTimeout(() => {
        setClicks(0);
        setMood("happy");
        showMessage("...Fine. I forgive you.");
      }, 6000);
    } else if (Math.random() < 0.2) {
      setMood("excited");
      showMessage("I require space pizza.");
    } else {
      setMood("happy");
      showMessage(
        PET_REACTIONS[Math.floor(Math.random() * PET_REACTIONS.length)]
      );
    }
  }, [sleeping, clicks, showMessage]);

  /* -------- Eye tracking vector (pet center → mouse) -------- */
  const petCenterX = x + 29;
  const petBottomY = getViewportHeight() - (TASKBAR_HEIGHT + PET_VERTICAL_OFFSET);
  const petCenterY = petBottomY - 26;
  const dx = mouse.x - petCenterX;
  const dy = mouse.y - petCenterY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxEyeMove = 2.5;
  const rawEyeX = dist > 0 ? (dx / dist) * Math.min(maxEyeMove, dist * 0.04) : 0;
  const rawEyeY = dist > 0 ? (dy / dist) * Math.min(maxEyeMove, dist * 0.04) : 0;
  const eyeX = Math.max(-maxEyeMove, Math.min(maxEyeMove, rawEyeX));
  const eyeY = Math.max(-maxEyeMove, Math.min(maxEyeMove, rawEyeY));

  const xpPercent = xp % 100;

  const mouthClass =
    activeMood === "happy" || activeMood === "excited"
      ? " smile"
      : activeMood === "angry"
      ? " frown"
      : activeMood === "sleepy"
      ? " flat"
      : "";

  return (
    <div
      ref={petRef}
      className={`alien-pet${walking ? " walking" : ""}${
        wave ? " wave" : ""
      }${sleeping ? " sleeping" : ""}${leveledUp ? " leveled" : ""}`}
      style={{
        left: `${x}px`,
        bottom: `${TASKBAR_HEIGHT + PET_VERTICAL_OFFSET}px`,
      }}
      aria-hidden="true"
    >
      {/* Speech bubble */}
      {message && (
        <div className="alien-bubble">
          <div className="alien-bubble-header">
            <span className="alien-level">CREW · Lv.{level}</span>
            {lootFound && (
              <span className="alien-loot-badge">+ {lootFound}</span>
            )}
          </div>
          <span className="alien-bubble-text">{message}</span>
          <div className="alien-xp-track" title={`XP: ${xp} / ${level * 100}`}>
            <div
              className="alien-xp-fill"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Always-visible mini level badge */}
      <div className="alien-level-pin" title={`Crew Level ${level}`}>
        L{level}
      </div>

      {/* Clickable body */}
      <div
        className={`alien-body mood-${activeMood}`}
        onClick={petAlien}
        role="button"
        tabIndex={0}
        aria-label={`Pet alien crew member, level ${level}. Click to interact.`}
        title={`Crew member · Lv.${level} · Click to interact`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            petAlien();
          }
        }}
      >
        {/* Helmet glare */}
        <div className="alien-visor" />

        {/* Eyes (tracking on wrapper, blink on inner eye) */}
        <div
          className="alien-eye-wrap left"
          style={{ transform: `translate(${eyeX}px, ${eyeY}px)` }}
        >
          <div className="alien-eye">
            <div className="alien-pupil" />
          </div>
        </div>
        <div
          className="alien-eye-wrap right"
          style={{ transform: `translate(${eyeX}px, ${eyeY}px)` }}
        >
          <div className="alien-eye">
            <div className="alien-pupil" />
          </div>
        </div>

        {/* Mouth */}
        <div className={`alien-mouth${mouthClass}`} />

        {/* Arms */}
        <div className="alien-arm left-arm" />
        <div className="alien-arm right-arm" />

        {/* Feet */}
        <div className="foot-left" />
        <div className="foot-right" />

        {/* Sleep indicator */}
        {sleeping && <div className="alien-zzz">z</div>}
      </div>
    </div>
  );
}
