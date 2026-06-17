import { useEffect, useState } from "react";

export default function ShipStatus() {
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptime((u) => u + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hrs = String(Math.floor(uptime / 3600)).padStart(2, "0");
  const mins = String(Math.floor((uptime % 3600) / 60)).padStart(2, "0");
  const secs = String(uptime % 60).padStart(2, "0");
  const [engines, setEngines] = useState(65);
  const [shields, setShields] = useState(82);
  const [comms, setComms] = useState(91);

useEffect(() => {
  const id = setInterval(() => {
    setEngines(60 + Math.floor(Math.random() * 30));
    setShields(75 + Math.floor(Math.random() * 20));
    setComms(85 + Math.floor(Math.random() * 15));
  }, 1200);

  return () => clearInterval(id);
}, []);
  return (
    <div style={styles.widget}>
      <div style={styles.header}>
        SHIP STATUS
      </div>
      <div className="ship-systems">
  <div className="system-row">
    <span>ENG</span>
    <div className="system-bar">
      <div
        className="system-fill"
        style={{ width: `${engines}%` }}
      />
    </div>
  </div>

  <div className="system-row">
    <span>SHD</span>
    <div className="system-bar">
      <div
        className="system-fill"
        style={{ width: `${shields}%` }}
      />
    </div>
  </div>

  <div className="system-row">
    <span>COM</span>
    <div className="system-bar">
      <div
        className="system-fill"
        style={{ width: `${comms}%` }}
      />
    </div>
  </div>
</div>
      <div style={styles.row}>
        <span>Core Systems</span>
        <span style={styles.online}>ONLINE</span>
      </div>

      <div style={styles.row}>
        <span>Navigation</span>
        <span style={styles.online}>ONLINE</span>
      </div>

      <div style={styles.row}>
        <span>Communications</span>
        <span style={styles.online}>ONLINE</span>
      </div>

      <div style={styles.row}>
        <span>Nova AI</span>
        <span style={styles.online}>ONLINE</span>
      </div>

      <div style={styles.divider} />

      <div style={styles.uptime}>
        <div style={styles.label}>UPTIME</div>
        <div style={styles.time}>
          {hrs}:{mins}:{secs}
        </div>
      </div>
    </div>
  );
}

const styles = {
  widget: {
    position: "fixed",
    right: 24,
    bottom: 95,
    width: 240,
    padding: 16,

    borderRadius: 18,

    background:
      "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",

    border:
      "1px solid rgba(255,255,255,0.12)",

    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",

    color: "#E5E7EB",

    zIndex: 2,
  },

  header: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: 700,
    marginBottom: 14,
    color: "#F59E0B",
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    fontSize: 13,
  },

  online: {
    color: "#D6D6D6",
    fontWeight: 600,
  },

  divider: {
    height: 1,
    margin: "12px 0",
    background: "rgba(255,255,255,0.08)",
  },

  uptime: {
    textAlign: "center",
  },

  label: {
    fontSize: 11,
    color: "#94A3B8",
    letterSpacing: 1.5,
  },

  time: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: 700,
  },
};
