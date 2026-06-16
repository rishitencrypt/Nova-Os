import { useEffect, useState } from "react";
import novaLogo from "../icons/nova-logo.svg";
function Taskbar({
  setHubOpen,
  hubOpen,
  openApps = [],
  focusApp,
}) {
  const [time, setTime] = useState(
    new Date().toLocaleTimeString()
  );

  const toggleStart = () => {
    setHubOpen(!hubOpen);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString()
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
  <div className="taskbar">

    <div className="taskbar-center">

      <img
        src={novaLogo}
        alt="NovaOS"
        className="taskbar-logo"
        onClick={toggleStart}
      />

      <div className="taskbar-apps">
        {openApps.map((app) => (
          <div
            key={app.name}
            className="taskbar-app"
            onClick={() => focusApp(app.name)}
          >
            <img
              src={app.icon}
              alt={app.name}
              width="24"
              height="24"
            />
          </div>
        ))}
      </div>

    </div>

    <div className="clock">
      {time}
    </div>

  </div>
);
}

export default Taskbar;