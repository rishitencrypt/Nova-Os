import { useState, useEffect } from "react";
import appearanceIcon from "../icons/appearance.svg";
import wallpaperIcon from "../icons/wallpaper.svg";
import systemIcon from "../icons/system.svg";
import infoIcon from "../icons/info.svg";
import novaLogo from "../icons/nova-logo.svg";
const WALLPAPERS = [
  { key: "wallpaper1", label: "Wallpaper 1" },
  { key: "wallpaper2", label: "Wallpaper 2" },
  { key: "wallpaper3", label: "Wallpaper 3" },
  { key: "wallpaper4", label: "Wallpaper 4" },
  { key: "default", label: "Default Wallpaper" },
];

const SECTIONS = [
  {
    id: "appearance",
    label: "Appearance",
    icon: appearanceIcon,
  },
  {
    id: "wallpapers",
    label: "Wallpapers",
    icon: wallpaperIcon,
  },
  {
    id: "system",
    label: "System",
    icon: systemIcon,
  },
  {
    id: "about",
    label: "About NovaOS",
    icon: infoIcon,
  },
];

function Settings({ wallpaper, setWallpaper, showToast}) {
  const [activeSection, setActiveSection] = useState("wallpapers");
  const [ram, setRam] = useState(42);
  const [cpu, setCpu] = useState(18);

  // Simulated system metrics (cosmetic, isolated to Settings)
  useEffect(() => {
    const id = setInterval(() => {
      setRam((v) => clamp(v + (Math.random() * 8 - 4), 28, 86));
      setCpu((v) => clamp(v + (Math.random() * 12 - 6), 6, 74));
    }, 1400);
    return () => clearInterval(id);
  }, []);

  const selectWallpaper = (key) => {
  setWallpaper(key);

  localStorage.setItem(
    "nova-wallpaper",
    key
  );

  showToast(
    "NovaOS",
    "Wallpaper changed"
  );
};

  return (
    <div className="nova-settings">
      <aside className="settings-sidebar">
        <div className="settings-brand">
          <span className="settings-brand-mark"><img
  src={novaLogo}
  alt="NovaOS"
  className="settings-brand-logo"
/></span>
          <div>
            <div className="settings-brand-title">NovaOS</div>
            <div className="settings-brand-sub">Control Center</div>
          </div>
        </div>

        <nav className="settings-nav">
  {SECTIONS.map((s) => (
    <button
      key={s.id}
      className={`settings-nav-item ${
        activeSection === s.id ? "active" : ""
      }`}
      onClick={() => setActiveSection(s.id)}
    >
      <img
        src={s.icon}
        alt=""
        className="settings-nav-icon"
      />

      <span>{s.label}</span>
    </button>
  ))}
</nav>

        <div className="settings-status-chip">
          <span className="status-dot" />
          System Online
        </div>
      </aside>

      <main className="settings-content">
        {activeSection === "appearance" && (
          <section className="settings-panel">
            <h2 className="panel-title">Appearance</h2>
            <p className="panel-sub">
              Tune the look and feel of your NovaOS environment.
            </p>

            <div className="setting-row">
              <div>
                <div className="setting-row-title">Active Wallpaper</div>
                <div className="setting-row-desc">
                  Currently set to{" "}
                  <strong>{labelFor(wallpaper)}</strong>
                </div>
              </div>
              <button
                className="ghost-btn"
                onClick={() => setActiveSection("wallpapers")}
              >
                Change
              </button>
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-row-title">Glass Effect</div>
                <div className="setting-row-desc">
                  Backdrop blur and saturation
                </div>
              </div>
              <span className="pill pill-on">Enabled</span>
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-row-title">Accent Color</div>
                <div className="setting-row-desc">Indigo (system default)</div>
              </div>
              <span className="accent-swatch" />
            </div>
          </section>
        )}

        {activeSection === "wallpapers" && (
          <section className="settings-panel">
            <h2 className="panel-title">Wallpapers</h2>
            <p className="panel-sub">
              Select a live wallpaper. Changes apply instantly.
            </p>

            <div className="wallpaper-grid">
              {WALLPAPERS.map((w) => (
                <button
                  key={w.key}
                  className={`wallpaper-card ${
                    wallpaper === w.key ? "selected" : ""
                  }`}
                  onClick={() => selectWallpaper(w.key)}
                >
                  <div className={`wallpaper-preview preview-${w.key}`}>
                    {wallpaper === w.key && (
                      <span className="wallpaper-check">✓</span>
                    )}
                  </div>
                  <span className="wallpaper-label">{w.label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {activeSection === "system" && (
          <section className="settings-panel">
            <h2 className="panel-title">System</h2>
            <p className="panel-sub">Live system diagnostics.</p>

            <div className="metric-card">
              <div className="metric-head">
                <span>RAM Usage</span>
                <span className="metric-value">{Math.round(ram)}%</span>
              </div>
              <div className="metric-bar">
                <div
                  className="metric-fill ram"
                  style={{ width: `${ram}%` }}
                />
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-head">
                <span>CPU Usage</span>
                <span className="metric-value">{Math.round(cpu)}%</span>
              </div>
              <div className="metric-bar">
                <div
                  className="metric-fill cpu"
                  style={{ width: `${cpu}%` }}
                />
              </div>
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-row-title">System Status</div>
                <div className="setting-row-desc">All services nominal</div>
              </div>
              <span className="pill pill-on">
                <span className="status-dot" /> ONLINE
              </span>
            </div>

            <div className="setting-row">
              <div>
                <div className="setting-row-title">NovaOS Version</div>
                <div className="setting-row-desc">Stable channel</div>
              </div>
              <span className="pill">1.0</span>
            </div>
          </section>
        )}

        {activeSection === "about" && (
          <section className="settings-panel about-panel">
            <div className="about-logo"><div className="about-logo">
  <img
    src={novaLogo}
    alt="NovaOS"
    className="about-logo-img"
  />
</div></div>
            <h1 className="about-title">NovaOS</h1>
            <p className="about-tagline">Experimental Desktop Environment</p>

            <div className="about-meta">
              <div className="about-meta-row">
                <span>Version</span>
                <strong>1.0</strong>
              </div>
              <div className="about-meta-row">
                <span>Created by</span>
                <strong>RishitEncrypt</strong>
              </div>
              <div className="about-meta-row">
                <span>Status</span>
                <strong className="online-text">ONLINE</strong>
              </div>
            </div>

            <p className="about-footer">
              © 2026 RishitEncrypt. Built for the bridge.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function labelFor(key) {
  const found = WALLPAPERS.find((w) => w.key === key);
  return found ? found.label : "Default Wallpaper";
}

export default Settings;
