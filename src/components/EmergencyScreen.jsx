import { useState, useEffect } from "react";

const WARNINGS = [
  "UNKNOWN SIGNAL DETECTED",
  "GRAVITATIONAL ANOMALY DETECTED",
  "COMMUNICATIONS LOST",
  "SECTOR BREACH DETECTED",
  "UNAUTHORIZED VESSEL DETECTED",
];

function EmergencyScreen({
  enterCommand,
  exitEmergency,
}) {
  const [code, setCode] =
    useState("");

  const [timeLeft, setTimeLeft] =
    useState(60);

  const [warning, setWarning] =
    useState(WARNINGS[0]);

  useEffect(() => {
    const countdown =
      setInterval(() => {
        setTimeLeft((t) =>
          t > 0 ? t - 1 : 0
        );
      }, 1000);

    return () =>
      clearInterval(countdown);
  }, []);

  useEffect(() => {
    const alerts =
      setInterval(() => {
        const random =
          WARNINGS[
            Math.floor(
              Math.random() *
                WARNINGS.length
            )
          ];

        setWarning(random);
      }, 4000);

    return () =>
      clearInterval(alerts);
  }, []);

  return (
    <div className="emergency-screen">

      <div className="alert-icon">
        ⚠
      </div>

      <h1>RED ALERT</h1>

      <div className="warning-text">
        {warning}
      </div>

      <div className="countdown-box">
        RESPONSE WINDOW

        <div className="countdown">
          00:
          {String(
            timeLeft
          ).padStart(2, "0")}
        </div>
      </div>

      <div className="threat-panel">

        <div>
          Threat Level
          <span>
            CRITICAL
          </span>
        </div>

        <div>
          Hull Integrity
          <span>76%</span>
        </div>

        <div>
          Shield Status
          <span>ONLINE</span>
        </div>

        <div>
          Signal Source
          <span>
            UNKNOWN
          </span>
        </div>

      </div>

      <input
        className="override-input"
        placeholder="Override Code"
        value={code}
        onChange={(e) =>
          setCode(
            e.target.value
          )
        }
      />

      <div className="alert-buttons">

        <button
          onClick={() => {
            if (
              code ===
              "NOVA-77"
            ) {
              enterCommand();
            } else {
              alert(
                "INVALID OVERRIDE CODE"
              );
            }
          }}
        >
          ENTER COMMAND CENTER
        </button>

        <button
          className="secondary"
          onClick={
            exitEmergency
          }
        >
          ABORT ALERT
        </button>

      </div>

    </div>
  );
}

export default EmergencyScreen;