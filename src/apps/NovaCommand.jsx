import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ============================================================
   Nova Command — spacecraft bridge / command console
   Self-contained. Scoped styles via <style>. No external deps.
   Design: matte graphite surfaces, single indigo accent,
   status color only for nominal / warning / critical.
   ============================================================ */

const TABS = [
  "Navigation",
  "Engineering",
  "Communications",
  "Defense",
  "Systems",
  "Logs",
];

const DESTINATIONS = [
  { id: "prox", name: "Proxima Centauri b", dist: 4.24, bearing: 41 },
  { id: "alph", name: "Alpha Centauri A", dist: 4.37, bearing: 128 },
  { id: "barn", name: "Barnard's Star", dist: 5.96, bearing: 213 },
  { id: "siri", name: "Sirius B", dist: 8.6, bearing: 300 },
  { id: "vega", name: "Vega Relay", dist: 25.0, bearing: 76 },
];

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const ts = () =>
  new Date().toLocaleTimeString([], { hour12: false });

// status from a 0-100 value (higher is better)
const level = (v, warn = 35, crit = 18) =>
  v <= crit ? "crit" : v <= warn ? "warn" : "ok";

function NovaCommand() {
  const [tab, setTab] = useState("Navigation");

  const [ship, setShip] = useState({
    hull: 98,
    fuel: 84,
    life: 99,
    coolant: 71,
    energy: 68, // available power headroom
  });

  // discrete subsystem state
  const [reactor, setReactor] = useState(72); // % output target
  const [power, setPower] = useState({
    propulsion: 35,
    shields: 25,
    sensors: 20,
  }); // routed power, sums toward reactor output
  const [cooling, setCooling] = useState("auto"); // off | auto | max

  const [autopilot, setAutopilot] = useState(false);
  const [hyperCharge, setHyperCharge] = useState(0); // 0..100 spool
  const [docking, setDocking] = useState(false);
  const [course, setCourse] = useState(null); // destination id

  const [shields, setShields] = useState(false);
  const [alertState, setAlertState] = useState("green"); // green|amber|red
  const [countermeasures, setCountermeasures] = useState(0);

  const [sensorRange, setSensorRange] = useState("short"); // short|long
  const [contacts, setContacts] = useState([]);
  const [broadcasting, setBroadcasting] = useState(false);

  const [reports, setReports] = useState([]);
  const [reactorTrace, setReactorTrace] = useState(
    Array.from({ length: 40 }, () => 70)
  );

  const [log, setLog] = useState([
    { t: ts(), m: "Bridge systems online.", s: "info" },
    { t: ts(), m: "All stations report nominal.", s: "info" },
  ]);
  const logRef = useRef(null);
  const emActive = alertState === "red";

  const pushLog = useCallback((m, s = "info") => {
    setLog((l) => [...l.slice(-120), { t: ts(), m, s }]);
  }, []);

  // ---- derived values ----
  const routedTotal = power.propulsion + power.shields + power.sensors;
  const powerDeficit = routedTotal > reactor;
  const target = useMemo(
    () => DESTINATIONS.find((d) => d.id === course) || null,
    [course]
  );
  const etaDays = target
    ? Math.max(1, Math.round((target.dist * 410) / (power.propulsion + 1)))
    : null;

  // ---- live simulation tick ----
  useEffect(() => {
    const id = setInterval(() => {
      setShip((s) => {
        const next = { ...s };
        const heat =
          reactor / 100 +
          (shields ? 0.3 : 0) +
          (hyperCharge > 0 ? 0.4 : 0);
        const coolRate =
          cooling === "max" ? 1.4 : cooling === "auto" ? 0.9 : 0;
        next.coolant = clamp(s.coolant - heat * 1.2 + coolRate);
        const headroomTarget = clamp(reactor - routedTotal + 50);
        next.energy = clamp(s.energy + (headroomTarget - s.energy) * 0.15);
        if (shields) next.energy = clamp(next.energy - 0.6);
        if (hyperCharge > 0 && hyperCharge < 100) {
          next.fuel = clamp(s.fuel - 0.4);
        }
        if (next.coolant < 15) {
          next.life = clamp(s.life - 0.5);
          next.hull = clamp(s.hull - 0.2);
        }
        return next;
      });

      setHyperCharge((h) => (h > 0 && h < 100 ? clamp(h + 6) : h));
      setCountermeasures((c) => (c > 0 ? Math.max(0, c - 4) : 0));
      setReactorTrace((tr) => [
        ...tr.slice(1),
        clamp(reactor + (Math.random() - 0.5) * 5),
      ]);
    }, 1200);
    return () => clearInterval(id);
  }, [reactor, shields, hyperCharge, cooling, routedTotal]);

  // ---- automatic emergency escalation ----
  useEffect(() => {
    if (ship.hull < 30) {
      if (alertState !== "red") {
        // avoid synchronous setState inside effect (can trigger cascading renders)
        setTimeout(() => setAlertState("red"), 0);
      }
    } else if (ship.life < 40) {
      if (alertState === "green") {
        setTimeout(() => setAlertState("amber"), 0);
      }
    }
  }, [ship.hull, ship.life, alertState]);

  // ---- emergency mode side effects ----
  const prevEm = useRef(false);
  useEffect(() => {
    if (emActive && !prevEm.current) {
      setTab("Defense");
      // avoid synchronous setState inside effect (can trigger cascading renders)
      setTimeout(() => {
        if (!shields) setShields(true);
      }, 0);
      pushLog("EMERGENCY: ship-wide red alert declared.", "crit");
      pushLog("Defense station given command priority.", "crit");
      pushLog("Shields raised automatically.", "warn");
    }
    if (!emActive && prevEm.current) {
      pushLog("Red alert cleared. Returning to standard operations.", "info");
    }
    prevEm.current = emActive;
  }, [emActive, shields, pushLog]);

  // periodic auto log entries while in emergency
  useEffect(() => {
    if (!emActive) return;
    const id = setInterval(() => {
      const lines = [
        "Damage control teams holding stations.",
        "Monitoring hull stress along frame 7.",
        "Reactor containment within tolerance.",
        "Shield harmonics stable.",
      ];
      pushLog(lines[Math.floor(Math.random() * lines.length)], "warn");
    }, 5000);
    return () => clearInterval(id);
  }, [emActive, pushLog]);

  // autoscroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log, tab]);

  // ============================================================
  // CONTROL HANDLERS — every one mutates real state
  // ============================================================

  const plotCourse = (d) => {
    setCourse(d.id);
    pushLog(`Course plotted to ${d.name} (${d.dist} ly).`, "info");
  };

  const toggleAutopilot = () => {
    if (!course && !autopilot) {
      pushLog("Autopilot rejected: no course set.", "warn");
      return;
    }
    setAutopilot((a) => {
      const n = !a;
      pushLog(n ? "Autopilot engaged." : "Autopilot disengaged.", "info");
      if (n) setPower((p) => ({ ...p, propulsion: clamp(p.propulsion + 10, 0, 80) }));
      return n;
    });
  };

  const engageHyperdrive = () => {
    if (hyperCharge >= 100) {
      if (ship.fuel < 18) {
        pushLog("Hyperdrive jump aborted: insufficient fuel.", "crit");
        return;
      }
      setShip((s) => ({ ...s, fuel: clamp(s.fuel - 18) }));
      setHyperCharge(0);
      pushLog(
        target ? `Hyperspace jump to ${target.name} complete.` : "Hyperspace jump complete.",
        "info"
      );
      if (target) setCourse(null);
      return;
    }
    if (hyperCharge > 0) {
      setHyperCharge(0);
      pushLog("Hyperdrive spool aborted.", "warn");
      return;
    }
    if (ship.fuel < 25) {
      pushLog("Cannot spool hyperdrive: fuel below safe threshold.", "warn");
      return;
    }
    setHyperCharge(6);
    pushLog("Hyperdrive spooling up.", "info");
  };

  const toggleDocking = () => {
    setDocking((d) => {
      const n = !d;
      pushLog(n ? "Docking mode engaged. Thrusters to fine control." : "Docking clamps released.", "info");
      setPower((p) => ({ ...p, propulsion: n ? 8 : 35 }));
      if (n) setAutopilot(false);
      return n;
    });
  };

  const setReactorOutput = (v) => {
    setReactor(v);
    if (v < routedTotal) pushLog(`Reactor output set to ${v}%. Power demand exceeds supply.`, "warn");
  };

  const routePower = (key, v) => {
    setPower((p) => ({ ...p, [key]: v }));
  };

  const cycleCooling = () => {
    setCooling((c) => {
      const order = ["off", "auto", "max"];
      const n = order[(order.indexOf(c) + 1) % order.length];
      pushLog(`Cooling system set to ${n.toUpperCase()}.`, n === "off" ? "warn" : "info");
      return n;
    });
  };

  const toggleShields = () => {
    setShields((on) => {
      const n = !on;
      if (n && ship.energy < 12) {
        pushLog("Shields failed to raise: insufficient power headroom.", "crit");
        return on;
      }
      pushLog(n ? "Shields raised." : "Shields lowered.", n ? "info" : "warn");
      if (n) setShip((s) => ({ ...s, energy: clamp(s.energy - 10) }));
      return n;
    });
  };

  const cycleAlert = () => {
    setAlertState((a) => {
      const order = ["green", "amber", "red"];
      const n = order[(order.indexOf(a) + 1) % order.length];
      if (n !== "red")
        pushLog(`Alert state set to ${n.toUpperCase()}.`, n === "amber" ? "warn" : "info");
      return n;
    });
  };

  const fireCountermeasures = () => {
    if (countermeasures > 0) {
      pushLog("Countermeasures recharging.", "warn");
      return;
    }
    if (ship.energy < 15) {
      pushLog("Countermeasures need more power headroom.", "warn");
      return;
    }
    setCountermeasures(100);
    setShip((s) => ({ ...s, energy: clamp(s.energy - 15) }));
    pushLog("Countermeasures deployed. Decoys away.", "info");
  };

  const scanSector = () => {
    if (ship.energy < 8) {
      pushLog("Scan failed: power headroom too low.", "warn");
      return;
    }
    setShip((s) => ({ ...s, energy: clamp(s.energy - 8) }));
    const pool =
      sensorRange === "long"
        ? [
            "Derelict freighter, faint power signature",
            "Ice comet, water-rich",
            "Unregistered relay beacon",
            "Gravitational lensing anomaly",
            "Distant convoy, 3 contacts",
          ]
        : [
            "Micrometeoroid cluster",
            "Mining drone, idle",
            "Debris field",
            "Survey marker",
          ];
    const found = pool[Math.floor(Math.random() * pool.length)];
    const bearing = Math.floor(Math.random() * 360);
    const range =
      sensorRange === "long"
        ? (Math.random() * 40 + 10).toFixed(1)
        : (Math.random() * 8 + 0.5).toFixed(1);
    setContacts((c) => [{ id: Date.now(), found, bearing, range }, ...c.slice(0, 7)]);
    pushLog(`Contact: ${found} \u2014 bearing ${bearing}\u00B0, ${range} ly.`, "info");
  };

  const toggleSensorRange = () => {
    setSensorRange((r) => {
      const n = r === "short" ? "long" : "short";
      pushLog(`Sensors switched to ${n}-range.`, "info");
      if (n === "long") setPower((p) => ({ ...p, sensors: clamp(p.sensors + 10, 0, 60) }));
      return n;
    });
  };

  const toggleBroadcast = () => {
    setBroadcasting((b) => {
      const n = !b;
      pushLog(n ? "Broadcasting identification signal." : "Signal broadcast stopped.", "info");
      return n;
    });
  };

  const runDiagnostics = () => {
    const r = {
      id: Date.now(),
      t: ts(),
      hull: Math.round(ship.hull),
      fuel: Math.round(ship.fuel),
      life: Math.round(ship.life),
      coolant: Math.round(ship.coolant),
      reactor,
      verdict:
        ship.hull < 40 || ship.coolant < 20
          ? "ATTENTION REQUIRED"
          : ship.fuel < 30
          ? "ADVISORY"
          : "NOMINAL",
    };
    setReports((p) => [r, ...p.slice(0, 9)]);
    pushLog(`Diagnostics complete: ${r.verdict}.`, r.verdict === "NOMINAL" ? "info" : "warn");
  };

  const runMaintenance = () => {
    if (ship.energy < 10) {
      pushLog("Maintenance deferred: insufficient power.", "warn");
      return;
    }
    setShip((s) => ({
      ...s,
      hull: clamp(s.hull + 6),
      coolant: clamp(s.coolant + 8),
      energy: clamp(s.energy - 10),
    }));
    pushLog("Maintenance cycle complete. Hull and coolant serviced.", "info");
  };

  const jettisonHeat = () => {
    setShip((s) => ({ ...s, coolant: clamp(s.coolant + 25) }));
    pushLog("Emergency heat sink purged. Coolant reserves restored.", "warn");
  };

  // ============================================================
  // RENDER
  // ============================================================

  const TELEMETRY = [
    ["Hull Integrity", ship.hull],
    ["Fuel Reserve", ship.fuel],
    ["Life Support", ship.life],
    ["Coolant", ship.coolant],
    ["Power Headroom", ship.energy],
  ];

  return (
    <>
      <style>{css}</style>
      <div className={`nc ${emActive ? "nc-emergency" : ""}`}>
        {/* ---------- TOP NAV ---------- */}
        <div className="nc-topnav">
          <div className="nc-brand">
            <span className="nc-brand-mark" />
            NOVA COMMAND
          </div>
          <div className="nc-tabs">
            {TABS.map((t) => (
              <button
                key={t}
                className={`nc-tab ${tab === t ? "active" : ""} ${
                  emActive && t === "Defense" ? "priority" : ""
                }`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className={`nc-alertpill nc-${alertState}`}>
            <span className="nc-dot" />
            {alertState === "green"
              ? "CONDITION GREEN"
              : alertState === "amber"
              ? "CONDITION AMBER"
              : "RED ALERT"}
          </div>
        </div>

        {emActive && (
          <div className="nc-banner">
            <span className="nc-banner-bar" />
            SHIP-WIDE EMERGENCY \u2014 DEFENSE STATION HAS COMMAND PRIORITY
          </div>
        )}

        {/* ---------- BODY GRID ---------- */}
        <div className="nc-body">
          {/* LEFT: telemetry */}
          <aside className="nc-col nc-left">
            <div className="nc-head">SHIP STATUS</div>
            {TELEMETRY.map(([label, v]) => {
              const st = level(v);
              return (
                <div className="nc-tele" key={label}>
                  <div className="nc-tele-row">
                    <span>{label}</span>
                    <span className={`nc-val nc-${st}`}>{Math.round(v)}%</span>
                  </div>
                  <div className="nc-bar">
                    <div className={`nc-bar-fill nc-${st}`} style={{ width: `${v}%` }} />
                  </div>
                </div>
              );
            })}

            <div className="nc-head">REACTOR OUTPUT</div>
            <svg className="nc-trace" viewBox="0 0 100 30" preserveAspectRatio="none">
              <polyline
                points={reactorTrace
                  .map((v, i) => `${(i / (reactorTrace.length - 1)) * 100},${30 - (v / 100) * 28}`)
                  .join(" ")}
              />
            </svg>
            <div className="nc-tele-row nc-mini">
              <span>Output</span>
              <span className="nc-val">{reactor}%</span>
            </div>
            <div className="nc-tele-row nc-mini">
              <span>Routed Load</span>
              <span className={`nc-val ${powerDeficit ? "nc-warn" : ""}`}>{routedTotal}%</span>
            </div>

            <div className="nc-head">SUBSYSTEMS</div>
            <div className="nc-leds">
              {[
                ["NAV", course ? "ok" : "idle"],
                ["AUTO", autopilot ? "ok" : "idle"],
                ["SHLD", shields ? "ok" : "idle"],
                ["COOL", cooling === "off" ? "warn" : "ok"],
                ["SENS", sensorRange === "long" ? "ok" : "idle"],
                ["COMM", broadcasting ? "ok" : "idle"],
              ].map(([l, s]) => (
                <span className="nc-led" key={l}>
                  <i className={`nc-${s}`} />
                  {l}
                </span>
              ))}
            </div>
          </aside>

          {/* CENTER: operational view */}
          <main className="nc-col nc-center">
            <CenterView
              tab={tab}
              ctx={{
                target,
                etaDays,
                autopilot,
                hyperCharge,
                docking,
                reactor,
                power,
                routedTotal,
                powerDeficit,
                cooling,
                shields,
                alertState,
                countermeasures,
                sensorRange,
                contacts,
                broadcasting,
                reports,
                ship,
                log,
              }}
            />
          </main>

          {/* RIGHT: controls */}
          <aside className="nc-col nc-right">
            <div className="nc-head">{tab.toUpperCase()} CONTROLS</div>
            <ControlPanel
              tab={tab}
              state={{
                course,
                autopilot,
                hyperCharge,
                docking,
                reactor,
                power,
                cooling,
                shields,
                alertState,
                countermeasures,
                sensorRange,
                broadcasting,
                ship,
                routedTotal,
              }}
              actions={{
                plotCourse,
                toggleAutopilot,
                engageHyperdrive,
                toggleDocking,
                setReactorOutput,
                routePower,
                cycleCooling,
                toggleShields,
                cycleAlert,
                fireCountermeasures,
                scanSector,
                toggleSensorRange,
                toggleBroadcast,
                runDiagnostics,
                runMaintenance,
                jettisonHeat,
              }}
            />
          </aside>
        </div>

        {/* ---------- BOTTOM: live event log ---------- */}
        <div className="nc-logbar">
          <div className="nc-logbar-head">
            EVENT LOG
            <span className="nc-logbar-count">{log.length}</span>
          </div>
          <div className="nc-logbar-feed" ref={logRef}>
            {log.map((e, i) => (
              <div className={`nc-logline nc-${e.s}`} key={i}>
                <span className="nc-logtime">{e.t}</span>
                <span className="nc-logsev" />
                {e.m}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   CENTER OPERATIONAL VIEW (per tab)
   ============================================================ */
function CenterView({ tab, ctx }) {
  if (tab === "Navigation") {
    return (
      <>
        <div className="nc-head">NAVIGATION PLOT</div>
        <div className="nc-readout">
          <Field label="Course" value={ctx.target ? ctx.target.name : "\u2014 none \u2014"} />
          <Field label="Distance" value={ctx.target ? `${ctx.target.dist} ly` : "\u2014"} />
          <Field label="ETA" value={ctx.etaDays ? `${ctx.etaDays} d` : "\u2014"} />
          <Field label="Bearing" value={ctx.target ? `${ctx.target.bearing}\u00B0` : "\u2014"} />
          <Field label="Autopilot" value={ctx.autopilot ? "ENGAGED" : "STANDBY"} state={ctx.autopilot ? "ok" : "idle"} />
          <Field label="Docking" value={ctx.docking ? "ACTIVE" : "\u2014"} state={ctx.docking ? "warn" : "idle"} />
        </div>
        <div className="nc-head">HYPERDRIVE</div>
        <div className="nc-progress-wrap">
          <div className="nc-progress">
            <div
              className={`nc-progress-fill ${ctx.hyperCharge >= 100 ? "ready" : ""}`}
              style={{ width: `${ctx.hyperCharge}%` }}
            />
          </div>
          <span className="nc-progress-label">
            {ctx.hyperCharge === 0
              ? "OFFLINE"
              : ctx.hyperCharge >= 100
              ? "READY TO JUMP"
              : `SPOOLING ${ctx.hyperCharge}%`}
          </span>
        </div>
      </>
    );
  }

  if (tab === "Engineering") {
    return (
      <>
        <div className="nc-head">POWER DISTRIBUTION</div>
        <div className="nc-readout">
          <Field label="Reactor Output" value={`${ctx.reactor}%`} />
          <Field label="Total Load" value={`${ctx.routedTotal}%`} state={ctx.powerDeficit ? "crit" : "ok"} />
          <Field label="Propulsion" value={`${ctx.power.propulsion}%`} />
          <Field label="Shields" value={`${ctx.power.shields}%`} />
          <Field label="Sensors" value={`${ctx.power.sensors}%`} />
          <Field label="Cooling" value={ctx.cooling.toUpperCase()} state={ctx.cooling === "off" ? "warn" : "ok"} />
        </div>
        {ctx.powerDeficit && (
          <div className="nc-inline-warn">POWER DEMAND EXCEEDS REACTOR OUTPUT</div>
        )}
        <div className="nc-head">THERMAL</div>
        <div className="nc-tele">
          <div className="nc-tele-row">
            <span>Coolant Reserve</span>
            <span className={`nc-val nc-${level(ctx.ship.coolant)}`}>{Math.round(ctx.ship.coolant)}%</span>
          </div>
          <div className="nc-bar">
            <div className={`nc-bar-fill nc-${level(ctx.ship.coolant)}`} style={{ width: `${ctx.ship.coolant}%` }} />
          </div>
        </div>
      </>
    );
  }

  if (tab === "Communications") {
    return (
      <>
        <div className="nc-head">SENSOR CONTACTS</div>
        <div className="nc-readout">
          <Field label="Sensor Range" value={ctx.sensorRange.toUpperCase()} />
          <Field label="Broadcast" value={ctx.broadcasting ? "ON AIR" : "SILENT"} state={ctx.broadcasting ? "ok" : "idle"} />
        </div>
        <div className="nc-table">
          <div className="nc-table-head">
            <span>CONTACT</span><span>BRG</span><span>RANGE</span>
          </div>
          {ctx.contacts.length === 0 && <div className="nc-empty">No contacts. Run a sector scan.</div>}
          {ctx.contacts.map((c) => (
            <div className="nc-table-row" key={c.id}>
              <span>{c.found}</span><span>{c.bearing}\u00B0</span><span>{c.range} ly</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (tab === "Defense") {
    return (
      <>
        <div className="nc-head">DEFENSE STATUS</div>
        <div className="nc-readout">
          <Field label="Shields" value={ctx.shields ? "RAISED" : "DOWN"} state={ctx.shields ? "ok" : "warn"} />
          <Field
            label="Alert State"
            value={ctx.alertState.toUpperCase()}
            state={ctx.alertState === "red" ? "crit" : ctx.alertState === "amber" ? "warn" : "ok"}
          />
          <Field label="Hull" value={`${Math.round(ctx.ship.hull)}%`} state={level(ctx.ship.hull)} />
          <Field
            label="Countermeasures"
            value={ctx.countermeasures > 0 ? `RECHARGE ${ctx.countermeasures}%` : "READY"}
            state={ctx.countermeasures > 0 ? "warn" : "ok"}
          />
        </div>
        <div className="nc-head">SHIELD INTEGRITY</div>
        <div className="nc-progress-wrap">
          <div className="nc-progress">
            <div
              className="nc-progress-fill"
              style={{ width: `${ctx.shields ? Math.min(100, ctx.power.shields * 2.5) : 0}%` }}
            />
          </div>
          <span className="nc-progress-label">
            {ctx.shields ? `${Math.min(100, Math.round(ctx.power.shields * 2.5))}% COVERAGE` : "SHIELDS DOWN"}
          </span>
        </div>
      </>
    );
  }

  if (tab === "Systems") {
    return (
      <>
        <div className="nc-head">DIAGNOSTIC REPORTS</div>
        {ctx.reports.length === 0 && <div className="nc-empty">No reports. Run diagnostics.</div>}
        <div className="nc-reports">
          {ctx.reports.map((r) => (
            <div className="nc-report" key={r.id}>
              <div className="nc-report-top">
                <span className="nc-logtime">{r.t}</span>
                <span className={`nc-tag nc-${r.verdict === "NOMINAL" ? "ok" : r.verdict === "ADVISORY" ? "warn" : "crit"}`}>
                  {r.verdict}
                </span>
              </div>
              <div className="nc-report-grid">
                <span>Hull {r.hull}%</span>
                <span>Fuel {r.fuel}%</span>
                <span>Life {r.life}%</span>
                <span>Coolant {r.coolant}%</span>
                <span>Reactor {r.reactor}%</span>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Logs
  return (
    <>
      <div className="nc-head">FULL EVENT LOG</div>
      <div className="nc-fulllog">
        {ctx.log.slice().reverse().map((e, i) => (
          <div className={`nc-logline nc-${e.s}`} key={i}>
            <span className="nc-logtime">{e.t}</span>
            <span className="nc-logsev" />
            {e.m}
          </div>
        ))}
      </div>
    </>
  );
}

function Field({ label, value, state }) {
  return (
    <div className="nc-field">
      <span className="nc-field-label">{label}</span>
      <span className={`nc-field-value ${state ? "nc-" + state : ""}`}>{value}</span>
    </div>
  );
}

/* ============================================================
   RIGHT CONTROL PANEL (per tab)
   ============================================================ */
function ControlPanel({ tab, state, actions }) {
  if (tab === "Navigation") {
    return (
      <>
        <div className="nc-sub">SET COURSE</div>
        <div className="nc-coursebtns">
          {DESTINATIONS.map((d) => (
            <button
              key={d.id}
              className={`nc-list-btn ${state.course === d.id ? "on" : ""}`}
              onClick={() => actions.plotCourse(d)}
            >
              <span>{d.name}</span>
              <span className="nc-list-meta">{d.dist} ly</span>
            </button>
          ))}
        </div>
        <Toggle label="Autopilot" on={state.autopilot} onClick={actions.toggleAutopilot} />
        <Toggle label="Docking Mode" on={state.docking} onClick={actions.toggleDocking} />
        <button
          className={`nc-btn ${state.hyperCharge >= 100 ? "primary" : ""}`}
          onClick={actions.engageHyperdrive}
        >
          {state.hyperCharge >= 100
            ? "EXECUTE JUMP"
            : state.hyperCharge > 0
            ? "ABORT SPOOL"
            : "SPOOL HYPERDRIVE"}
        </button>
      </>
    );
  }

  if (tab === "Engineering") {
    return (
      <>
        <Slider label="Reactor Output" value={state.reactor} onChange={actions.setReactorOutput} />
        <div className="nc-sub">POWER ROUTING</div>
        <Slider label="Propulsion" value={state.power.propulsion} max={80} onChange={(v) => actions.routePower("propulsion", v)} />
        <Slider label="Shields" value={state.power.shields} max={60} onChange={(v) => actions.routePower("shields", v)} />
        <Slider label="Sensors" value={state.power.sensors} max={60} onChange={(v) => actions.routePower("sensors", v)} />
        <div className="nc-sub">COOLING SYSTEM</div>
        <Segmented
          options={["off", "auto", "max"]}
          value={state.cooling}
          onChange={actions.cycleCooling}
        />
        <button className="nc-btn" onClick={actions.jettisonHeat}>PURGE HEAT SINK</button>
      </>
    );
  }

  if (tab === "Communications") {
    return (
      <>
        <button className="nc-btn primary" onClick={actions.scanSector}>SCAN SECTOR</button>
        <Toggle
          label="Long Range Sensors"
          on={state.sensorRange === "long"}
          onClick={actions.toggleSensorRange}
        />
        <Toggle label="Broadcast Signal" on={state.broadcasting} onClick={actions.toggleBroadcast} />
      </>
    );
  }

  if (tab === "Defense") {
    return (
      <>
        <Toggle label="Shields" on={state.shields} onClick={actions.toggleShields} />
        <div className="nc-sub">ALERT STATE</div>
        <button
          className={`nc-btn alert-${state.alertState}`}
          onClick={actions.cycleAlert}
        >
          {state.alertState === "green"
            ? "SET CONDITION AMBER"
            : state.alertState === "amber"
            ? "DECLARE RED ALERT"
            : "STAND DOWN ALERT"}
        </button>
        <button
          className="nc-btn"
          onClick={actions.fireCountermeasures}
          disabled={state.countermeasures > 0}
        >
          {state.countermeasures > 0 ? `RECHARGING ${state.countermeasures}%` : "DEPLOY COUNTERMEASURES"}
        </button>
      </>
    );
  }

  if (tab === "Systems") {
    return (
      <>
        <button className="nc-btn primary" onClick={actions.runDiagnostics}>RUN DIAGNOSTICS</button>
        <button className="nc-btn" onClick={actions.runMaintenance}>RUN MAINTENANCE</button>
        <div className="nc-sub">RESOURCE MANAGEMENT</div>
        <div className="nc-readout nc-readout-tight">
          <Field label="Fuel" value={`${Math.round(state.ship.fuel)}%`} state={level(state.ship.fuel)} />
          <Field label="Power Headroom" value={`${Math.round(state.ship.energy)}%`} state={level(state.ship.energy)} />
          <Field label="Coolant" value={`${Math.round(state.ship.coolant)}%`} state={level(state.ship.coolant)} />
          <Field label="Routed Load" value={`${state.routedTotal}%`} />
        </div>
      </>
    );
  }

  return <div className="nc-empty">Event log shown in the center panel and along the bottom bar.</div>;
}

/* ---------- control primitives ---------- */
function Toggle({ label, on, onClick }) {
  return (
    <button className="nc-toggle" onClick={onClick} aria-pressed={on}>
      <span>{label}</span>
      <span className={`nc-switch ${on ? "on" : ""}`}>
        <span className="nc-knob" />
      </span>
    </button>
  );
}

function Slider({ label, value, max = 100, onChange }) {
  return (
    <div className="nc-slider">
      <div className="nc-slider-row">
        <span>{label}</span>
        <span className="nc-val">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="nc-seg">
      {options.map((o) => (
        <button
          key={o}
          className={`nc-seg-btn ${value === o ? "on" : ""}`}
          onClick={onChange}
        >
          {o.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/* ============================================================
   SCOPED STYLES
   ============================================================ */
const css = `
.nc{
  --bg:#111315; --panel:#181B1F; --panel2:#22262B;
  --line:#2a2f35; --line2:#343a41;
  --tx:#F2F4F7; --tx2:#B8BEC7;
  --accent:#4F46E5; --accent2:#6366F1;
  --ok:#3FB950; --warn:#D29922; --crit:#F85149;
  position:relative; width:100%; height:100%;
  display:flex; flex-direction:column;
  background:var(--bg); color:var(--tx);
  font-family:"Inter",system-ui,sans-serif; font-size:12px;
  box-sizing:border-box; overflow:hidden;
}
.nc *{ box-sizing:border-box; }
.nc.nc-emergency{ --accent:#F85149; --accent2:#ff6b63; }
.nc.nc-emergency .nc-body{ box-shadow:inset 0 0 0 1px rgba(248,81,73,0.4); }

.nc-topnav{
  display:flex; align-items:center; gap:16px;
  height:42px; padding:0 12px; flex-shrink:0;
  background:var(--panel); border-bottom:1px solid var(--line);
}
.nc-brand{ display:flex; align-items:center; gap:8px; font-weight:600;
  letter-spacing:1.5px; font-size:12px; color:var(--tx); white-space:nowrap; }
.nc-brand-mark{ width:10px; height:10px; border-radius:2px; background:var(--accent); }
.nc-tabs{ display:flex; gap:2px; flex:1; }
.nc-tab{
  background:transparent; border:1px solid transparent; color:var(--tx2);
  font:inherit; font-size:11px; letter-spacing:.5px; padding:6px 11px;
  border-radius:3px; cursor:pointer; transition:background .12s, color .12s;
}
.nc-tab:hover{ background:var(--panel2); color:var(--tx); }
.nc-tab.active{ background:var(--panel2); color:var(--tx);
  border-color:var(--line2); box-shadow:inset 0 -2px 0 var(--accent); }
.nc-tab.priority{ color:var(--crit); }
.nc-alertpill{ display:flex; align-items:center; gap:6px; font-size:10px;
  letter-spacing:1px; padding:4px 9px; border-radius:3px; white-space:nowrap;
  border:1px solid var(--line2); }
.nc-alertpill .nc-dot{ width:7px; height:7px; border-radius:50%; }
.nc-green{ color:var(--ok); } .nc-green .nc-dot{ background:var(--ok); }
.nc-amber{ color:var(--warn); } .nc-amber .nc-dot{ background:var(--warn); }
.nc-red{ color:var(--crit); } .nc-red .nc-dot{ background:var(--crit);
  animation:nc-pulse 1s steps(2) infinite; }
@keyframes nc-pulse{ 50%{ opacity:.25; } }

.nc-banner{
  display:flex; align-items:center; gap:10px; flex-shrink:0;
  background:rgba(248,81,73,0.12); color:#ffb3ae;
  border-bottom:1px solid rgba(248,81,73,0.5);
  padding:6px 12px; font-size:11px; letter-spacing:1px; font-weight:600;
}
.nc-banner-bar{ width:4px; height:14px; background:var(--crit);
  animation:nc-pulse 1s steps(2) infinite; }

.nc-body{
  flex:1; min-height:0; display:grid; gap:1px; padding:1px;
  grid-template-columns:230px 1fr 250px; background:var(--line);
}
.nc-col{ background:var(--bg); overflow-y:auto; padding:12px; }
.nc-left{ background:var(--panel); }
.nc-right{ background:var(--panel); }
.nc-center{ background:var(--bg); }

.nc-head{ font-size:10px; letter-spacing:1.5px; color:var(--tx2);
  font-weight:600; margin:0 0 10px; padding-bottom:6px;
  border-bottom:1px solid var(--line); }
.nc-col .nc-head:not(:first-child){ margin-top:18px; }
.nc-sub{ font-size:10px; letter-spacing:1px; color:var(--tx2); margin:14px 0 7px; }

.nc-tele{ margin-bottom:9px; }
.nc-tele-row{ display:flex; justify-content:space-between; font-size:11px;
  margin-bottom:4px; color:var(--tx2); }
.nc-tele-row.nc-mini{ margin-bottom:2px; }
.nc-val{ color:var(--tx); font-variant-numeric:tabular-nums; }
.nc-val.nc-ok{ color:var(--ok); } .nc-val.nc-warn{ color:var(--warn); }
.nc-val.nc-crit{ color:var(--crit); }
.nc-bar{ height:5px; background:#0c0e10; border:1px solid var(--line);
  border-radius:2px; overflow:hidden; }
.nc-bar-fill{ height:100%; transition:width .6s ease; background:var(--accent); }
.nc-bar-fill.nc-ok{ background:var(--ok); }
.nc-bar-fill.nc-warn{ background:var(--warn); }
.nc-bar-fill.nc-crit{ background:var(--crit); }

.nc-trace{ width:100%; height:34px; background:#0c0e10; border:1px solid var(--line);
  border-radius:2px; display:block; margin-bottom:8px; }
.nc-trace polyline{ fill:none; stroke:var(--accent2); stroke-width:1; }

.nc-leds{ display:grid; grid-template-columns:1fr 1fr; gap:6px 8px; }
.nc-led{ display:flex; align-items:center; gap:6px; font-size:10px;
  letter-spacing:.5px; color:var(--tx2); }
.nc-led i{ width:7px; height:7px; border-radius:50%; background:var(--line2); }
.nc-led i.nc-ok{ background:var(--ok); }
.nc-led i.nc-warn{ background:var(--warn); }
.nc-led i.nc-idle{ background:var(--line2); }

.nc-readout{ display:grid; grid-template-columns:1fr 1fr; gap:1px;
  background:var(--line); border:1px solid var(--line); border-radius:3px; overflow:hidden; }
.nc-readout-tight{ grid-template-columns:1fr; }
.nc-field{ display:flex; justify-content:space-between; align-items:center;
  background:var(--panel); padding:8px 10px; }
.nc-field-label{ font-size:10px; letter-spacing:.5px; color:var(--tx2); }
.nc-field-value{ font-size:12px; font-weight:500; color:var(--tx);
  font-variant-numeric:tabular-nums; }
.nc-field-value.nc-ok{ color:var(--ok); } .nc-field-value.nc-warn{ color:var(--warn); }
.nc-field-value.nc-crit{ color:var(--crit); } .nc-field-value.nc-idle{ color:var(--tx2); }

.nc-progress-wrap{ display:flex; align-items:center; gap:10px; }
.nc-progress{ flex:1; height:10px; background:#0c0e10; border:1px solid var(--line);
  border-radius:2px; overflow:hidden; }
.nc-progress-fill{ height:100%; background:var(--accent); transition:width .5s ease; }
.nc-progress-fill.ready{ background:var(--ok); }
.nc-progress-label{ font-size:10px; letter-spacing:1px; color:var(--tx2);
  white-space:nowrap; min-width:90px; text-align:right; }

.nc-inline-warn{ margin-top:8px; font-size:10px; letter-spacing:1px;
  color:var(--warn); background:rgba(210,153,34,0.1);
  border:1px solid rgba(210,153,34,0.4); border-radius:3px; padding:6px 8px; }

.nc-table{ border:1px solid var(--line); border-radius:3px; overflow:hidden; }
.nc-table-head, .nc-table-row{ display:grid; grid-template-columns:1fr 50px 70px;
  gap:8px; padding:6px 10px; font-size:11px; }
.nc-table-head{ background:var(--panel2); color:var(--tx2); font-size:10px; letter-spacing:1px; }
.nc-table-row{ border-top:1px solid var(--line); color:var(--tx); }
.nc-table-row span:nth-child(2), .nc-table-row span:nth-child(3){ color:var(--tx2);
  font-variant-numeric:tabular-nums; }
.nc-empty{ font-size:11px; color:var(--tx2); padding:10px 0; opacity:.8; }

.nc-reports{ display:flex; flex-direction:column; gap:8px; }
.nc-report{ border:1px solid var(--line); border-radius:3px; background:var(--panel); padding:8px 10px; }
.nc-report-top{ display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
.nc-tag{ font-size:9px; letter-spacing:1px; padding:2px 6px; border-radius:2px; border:1px solid currentColor; }
.nc-tag.nc-ok{ color:var(--ok); } .nc-tag.nc-warn{ color:var(--warn); } .nc-tag.nc-crit{ color:var(--crit); }
.nc-report-grid{ display:flex; flex-wrap:wrap; gap:4px 14px; font-size:11px;
  color:var(--tx2); font-variant-numeric:tabular-nums; }

.nc-btn{ width:100%; margin-bottom:8px; padding:9px 10px; cursor:pointer;
  background:var(--panel2); color:var(--tx); border:1px solid var(--line2);
  border-radius:3px; font:inherit; font-size:11px; letter-spacing:.5px;
  text-align:left; transition:background .12s, border-color .12s, transform .05s; }
.nc-btn:hover{ background:#2c3137; border-color:#3d444c; }
.nc-btn:active{ transform:translateY(1px); }
.nc-btn:disabled{ opacity:.5; cursor:not-allowed; }
.nc-btn.primary{ border-color:var(--accent); color:#c7c9ff; background:rgba(79,70,229,0.14); }
.nc-btn.primary:hover{ background:rgba(79,70,229,0.24); }
.nc-btn.alert-amber{ border-color:var(--warn); color:var(--warn); }
.nc-btn.alert-red{ border-color:var(--crit); color:var(--crit); background:rgba(248,81,73,0.1); }

.nc-coursebtns{ display:flex; flex-direction:column; gap:4px; margin-bottom:10px; }
.nc-list-btn{ display:flex; justify-content:space-between; align-items:center;
  padding:7px 10px; cursor:pointer; background:var(--panel2);
  border:1px solid var(--line); border-radius:3px; color:var(--tx);
  font:inherit; font-size:11px; transition:background .12s, border-color .12s; }
.nc-list-btn:hover{ background:#2c3137; }
.nc-list-btn.on{ border-color:var(--accent); background:rgba(79,70,229,0.16); }
.nc-list-meta{ color:var(--tx2); font-size:10px; font-variant-numeric:tabular-nums; }

.nc-toggle{ width:100%; margin-bottom:8px; padding:8px 10px; cursor:pointer;
  display:flex; justify-content:space-between; align-items:center;
  background:var(--panel2); border:1px solid var(--line2); border-radius:3px;
  color:var(--tx); font:inherit; font-size:11px; letter-spacing:.5px; }
.nc-toggle:hover{ background:#2c3137; }
.nc-switch{ width:34px; height:18px; border-radius:10px; background:#0c0e10;
  border:1px solid var(--line2); position:relative; transition:background .15s; flex-shrink:0; }
.nc-switch .nc-knob{ position:absolute; top:1px; left:1px; width:14px; height:14px;
  border-radius:50%; background:var(--tx2); transition:left .15s, background .15s; }
.nc-switch.on{ background:rgba(79,70,229,0.5); border-color:var(--accent); }
.nc-switch.on .nc-knob{ left:17px; background:var(--accent2); }

.nc-slider{ margin-bottom:12px; }
.nc-slider-row{ display:flex; justify-content:space-between; font-size:11px;
  color:var(--tx2); margin-bottom:6px; }
.nc-slider input[type=range]{ width:100%; -webkit-appearance:none; appearance:none;
  height:4px; background:var(--line2); border-radius:2px; outline:none; }
.nc-slider input[type=range]::-webkit-slider-thumb{ -webkit-appearance:none;
  appearance:none; width:14px; height:14px; border-radius:2px; background:var(--accent2);
  cursor:pointer; border:1px solid var(--accent); }
.nc-slider input[type=range]::-moz-range-thumb{ width:14px; height:14px; border-radius:2px;
  background:var(--accent2); cursor:pointer; border:1px solid var(--accent); }

.nc-seg{ display:flex; border:1px solid var(--line2); border-radius:3px;
  overflow:hidden; margin-bottom:10px; }
.nc-seg-btn{ flex:1; padding:7px 0; background:var(--panel2); color:var(--tx2);
  border:none; border-right:1px solid var(--line2); font:inherit; font-size:10px;
  letter-spacing:1px; cursor:pointer; transition:background .12s, color .12s; }
.nc-seg-btn:last-child{ border-right:none; }
.nc-seg-btn.on{ background:rgba(79,70,229,0.2); color:var(--tx); }

.nc-logbar{ flex-shrink:0; height:128px; display:flex; flex-direction:column;
  background:var(--panel); border-top:1px solid var(--line); }
.nc-logbar-head{ display:flex; align-items:center; gap:8px; padding:6px 12px;
  font-size:10px; letter-spacing:1.5px; color:var(--tx2); font-weight:600;
  border-bottom:1px solid var(--line); }
.nc-logbar-count{ background:var(--panel2); border:1px solid var(--line);
  border-radius:8px; padding:0 7px; font-size:9px; color:var(--tx2); }
.nc-logbar-feed{ flex:1; overflow-y:auto; padding:6px 12px;
  font-family:"JetBrains Mono","SF Mono",monospace; }
.nc-fulllog{ font-family:"JetBrains Mono","SF Mono",monospace; }
.nc-logline{ display:flex; align-items:center; gap:8px; font-size:11px;
  padding:2px 0; color:var(--tx2); }
.nc-logtime{ color:#6b727b; font-variant-numeric:tabular-nums; flex-shrink:0; }
.nc-logsev{ width:3px; height:11px; flex-shrink:0; background:var(--line2); }
.nc-logline.nc-info .nc-logsev{ background:var(--accent2); }
.nc-logline.nc-warn{ color:#e3c98f; } .nc-logline.nc-warn .nc-logsev{ background:var(--warn); }
.nc-logline.nc-crit{ color:#ffb3ae; } .nc-logline.nc-crit .nc-logsev{ background:var(--crit); }

.nc-col::-webkit-scrollbar, .nc-logbar-feed::-webkit-scrollbar{ width:8px; }
.nc-col::-webkit-scrollbar-thumb, .nc-logbar-feed::-webkit-scrollbar-thumb{
  background:var(--line2); border-radius:0; }
.nc-col::-webkit-scrollbar-track, .nc-logbar-feed::-webkit-scrollbar-track{ background:transparent; }
`;

export default NovaCommand;
