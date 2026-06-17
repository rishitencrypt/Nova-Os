import novaLogo from "../icons/nova-logo.svg";
import calculatorIcon from "../icons/calculator.svg";
import folderIcon from "../icons/folder.svg";
import gameIcon from "../icons/game.svg";
import notesIcon from "../icons/notes.svg";
import novaAIIcon from "../icons/nova-ai.svg";
import musicIcon from "../icons/novamusic.svg";
import rocketIcon from "../icons/rocket.svg";
import settingsIcon from "../icons/settings.svg";
import systemIcon from "../icons/system.svg";
import wallpaperIcon from "../icons/wallpaper.svg";
function GettingStarted({ onContinue }) {
  return (
    <div className="welcome-overlay">
      <div className="welcome-card">

        <div className="welcome-left">
          <div className="welcome-logo">
            <img
              src={novaLogo}
              alt="NovaOS"
              className="welcome-logo-img"
            />
          </div>

          <h1>NovaOS</h1>

          <p>
            Version 1.0.2 • Bridge Interface
          </p>

          <div className="welcome-build">
            Safari/537.36
          </div>
        </div>

        <div className="welcome-right">

          <h2>Bridge Online</h2>

          <p>
            Welcome aboard, Captain.
            NovaOS has completed startup diagnostics and all core systems are operational.
            Your desktop is now equipped with AI assistance, media controls,
            system utilities, navigation tools and interactive desktop modules.
          </p>

          <div className="welcome-features">

  <div className="feature-item">
    <img src={novaAIIcon} alt="" />
    <span>Nova AI</span>
  </div>

  <div className="feature-item">
    <img src={rocketIcon} alt="" />
    <span>Nova Command</span>
  </div>

  <div className="feature-item">
    <img src={gameIcon} alt="" />
    <span>Stellar Navigation</span>
  </div>

  <div className="feature-item">
    <img src={musicIcon} alt="" />
    <span>Nova Music</span>
  </div>

  <div className="feature-item">
    <img src={folderIcon} alt="" />
    <span>Explorer</span>
  </div>

  <div className="feature-item">
    <img src={notesIcon} alt="" />
    <span>Notes</span>
  </div>

  <div className="feature-item">
    <img src={calculatorIcon} alt="" />
    <span>Calculator</span>
  </div>

  <div className="feature-item">
    <img src={settingsIcon} alt="" />
    <span>Settings</span>
  </div>

  <div className="feature-item">
    <img src={wallpaperIcon} alt="" />
    <span>Wallpapers</span>
  </div>

  <div className="feature-item">
    <img src={systemIcon} alt="" />
    <span>System Monitor</span>
  </div>

</div>
          

          <button
            className="welcome-btn"
            onClick={onContinue}
          >
            ENTER NOVA-OS
          </button>

        </div>

      </div>
    </div>
  );
}

export default GettingStarted;