import novaLogo from "../icons/nova-logo.svg";
function GettingStarted({
  onContinue,
}) {
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
            Bridge Interface v1.0
          </p>

        </div>

        <div className="welcome-right">

          <h2>
            Welcome Captain
          </h2>

          <p>
            NovaOS is now online.
            Access applications,
            customize your desktop,
            control media and
            manage system functions
            through the Nova Hub.
          </p>

          <div className="welcome-features">

            <div>
              * Nova AI
            </div>

            <div>
              * Nova Command
            </div>

            <div>
              * Nova Music
            </div>

            <div>
              * Settings
            </div>

            <div>
              * Live Wallpapers
            </div>

            <div>
              * Emergency Protocol
            </div>

          </div>

          <button
            className="welcome-btn"
            onClick={onContinue}
          >
            ENTER BRIDGE
          </button>

        </div>

      </div>

    </div>
  );
}

export default GettingStarted;