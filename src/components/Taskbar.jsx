import { useEffect, useState } from "react";

function Taskbar({
  toggleStart,
  openApps = [],
  focusApp,
}) {
  const [time, setTime] = useState(
    new Date().toLocaleTimeString()
  );

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

      <button
        className="start-btn"
        onClick={toggleStart}
      >
        NovaOS
      </button>

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

      <div className="clock">
        {time}
      </div>

    </div>
  );
}

export default Taskbar;