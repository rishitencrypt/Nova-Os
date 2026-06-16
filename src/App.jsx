import { useState, useEffect } from "react";

import "./App.css";

import DesktopIcon from "./components/DesktopIcon";
import Taskbar from "./components/Taskbar";
import Window from "./components/Window";
import StartMenu from "./components/StartMenu";
import VideoBackground from "./components/VideoBackground";
import BootScreen from "./components/BootScreen";
import rocketIcon from "./icons/rocket.svg";
import NovaCommand from "./apps/NovaCommand";
import Notes from "./apps/Notes";
import Explorer from "./apps/Explorer";
import Calculator from "./apps/Calculator";
import NovaAI from "./apps/NovaAI";
import novaAIIcon from "./icons/nova-ai.svg";
import notesIcon from "./icons/notes.svg";
import folderIcon from "./icons/folder.svg";
import calculatorIcon from "./icons/calculator.svg";
import OrbitalWidget from "./components/OrbitalWidget";
import NovaHub from "./components/NovaHub2";
import Settings from "./apps/Settings";
import novaLogo from "./icons/nova-logo.svg";
import EmergencyScreen from "./components/EmergencyScreen";
import settingsIcon from "./icons/settings.svg";
import Toast from "./components/Toast";
import notificationSound from "./assets/audio/notification.mp3";
import NovaMusic from "./apps/NovaMusic";
import musicIcon from "./icons/novamusic.svg";
import GettingStarted from "./components/GettingStarted";
function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [settingsMinimized, setSettingsMinimized] = useState(false);

  const [hubOpen, setHubOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [booting, setBooting] = useState(true);
  const [sleeping, setSleeping] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [shutdown, setShutdown] = useState(false);
  const [commandMinimized, setCommandMinimized] = useState(false);
  const [notesMinimized, setNotesMinimized] = useState(false);
  const [explorerMinimized, setExplorerMinimized] = useState(false);
  const [calcMinimized, setCalcMinimized] = useState(false);
  const [novaOpen, setNovaOpen] = useState(false);
  const [novaMinimized, setNovaMinimized] = useState(false);
  const [musicOpen, setMusicOpen] =
  useState(false);

const [musicMinimized,
setMusicMinimized] =
  useState(false);
  const [toast, setToast] =
  useState(null);
  const showToast = (
  title,
  message
) => {
  const audio = new Audio(
    notificationSound
  );

  audio.volume = 0.5;

  audio.play().catch(() => {});

  setToast({
    title,
    message,
  });
};
  const [wallpaper, setWallpaper] = useState(() => {
    return localStorage.getItem("nova-wallpaper") || "default";
  });
  const [showWelcome,
setShowWelcome] =
useState(() => {
  return (
    localStorage.getItem(
      "nova-onboarding-complete"
    ) !== "true"
  );
});
  const [startOpen] = useState(false);
  const [pinnedApps] = useState(() => {
    const savedPins = localStorage.getItem("novaPins");
    return savedPins
      ? JSON.parse(savedPins)
      : [
          {
            name: "Explorer",
            icon: folderIcon,
          },
          {
            name: "Nova AI",
            icon: novaAIIcon,
          },
          {
            name: "Nova Command",
            icon: rocketIcon,
          },
        ];
  });
  const [zIndexes, setZIndexes] = useState({
    notes: 20,
    explorer: 21,
    calc: 22,
    command: 23,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setBooting(false);
    }, 9000);

    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
  const seen = localStorage.getItem(
    "nova-welcome-shown"
  );

  if (!seen) {
    setTimeout(() => {
      showToast(
        "Welcome to NovaOS",
        "Open Settings to customize wallpapers and system preferences."
      );
    }, 1500);

    localStorage.setItem(
      "nova-welcome-shown",
      "true"
    );
  }
}, []);

  const bringToFront = (windowName) => {
    const highest = Math.max(...Object.values(zIndexes));

    setZIndexes((prev) => ({
      ...prev,
      [windowName]: highest + 1,
    }));
  };

  const taskbarApps = [
    ...pinnedApps,

    ...(notesOpen && !pinnedApps.some((app) => app.name === "Notes")
      ? [
          {
            name: "Notes",
            icon: notesIcon,
          },
        ]
      : []),

    ...(explorerOpen && !pinnedApps.some((app) => app.name === "Explorer")
      ? [
          {
            name: "Explorer",
            icon: folderIcon,
          },
        ]
      : []),

    ...(calcOpen && !pinnedApps.some((app) => app.name === "Calculator")
      ? [
          {
            name: "Calculator",
            icon: calculatorIcon,
          },
        ]
      : []),

    ...(novaOpen && !pinnedApps.some((app) => app.name === "Nova AI")
      ? [
          {
            name: "Nova AI",
            icon: novaAIIcon,
          },
        ]
      : []),

    ...(commandOpen && !pinnedApps.some((app) => app.name === "Nova Command")
      ? [
          {
            name: "Nova Command",
            icon: rocketIcon,
          },
        ]
      : []),

    ...(settingsOpen && !pinnedApps.some((app) => app.name === "Settings")
      ? [
          {
            name: "Settings",
            icon: settingsIcon,
          },
        ]
      : []),
      ...(musicOpen &&
!pinnedApps.some(
  app => app.name === "Nova Music"
)
  ? [{
      name: "Nova Music",
      icon: musicIcon,
    }]
  : []),
  ];

  if (booting) {
    return <BootScreen />;
  }

  if (shutdown) {
    return (
      <div className="shutdown-screen">
        <img src={novaLogo} alt="" width="120" />

        <h1>NovaOS</h1>

        <p>System Powered Off</p>
      </div>
    );
  }

  if (sleeping) {
    return (
      <div className="sleep-screen" onClick={() => setSleeping(false)}>
        <h1>Sleeping...</h1>

        <p>Click anywhere to wake</p>
      </div>
    );
  }

  if (emergencyMode) {
    return (
      <EmergencyScreen
        enterCommand={() => {
          setEmergencyMode(false);

          setCommandOpen(true);

          setCommandMinimized(false);
        }}
        exitEmergency={() => setEmergencyMode(false)}
      />
    );
  }

  return (
  <div
    className={`desktop ${
      emergencyMode ? "emergency-mode" : ""
    }`}
  >
    <VideoBackground wallpaperName={wallpaper} />

    {showWelcome && (
      <GettingStarted
        onContinue={() => {
          localStorage.setItem(
            "nova-onboarding-complete",
            "true"
          );

          setShowWelcome(false);

          showToast(
            "Bridge Online",
            "Welcome to NovaOS."
          );
        }}
      />
    )}

    {emergencyMode && (
      <div className="alert-banner">
        ⚠ RED ALERT — EMERGENCY PROTOCOL ACTIVE
      </div>
    )}

    <OrbitalWidget />

      <DesktopIcon
        icon={<img src={notesIcon} alt="" width="40" />}
        label="Notes"
        top="30px"
        left="30px"
        onDoubleClick={() => {
          setNotesOpen(true);
          setNotesMinimized(false);
        }}
      />

      <DesktopIcon
        icon={<img src={novaAIIcon} alt="" width="40" />}
        label="Nova AI"
        top="330px"
        left="30px"
        onDoubleClick={() => {
          setNovaOpen(true);
          setNovaMinimized(false);
        }}
      />

      <DesktopIcon
        icon={<img src={folderIcon} alt="" width="40" />}
        label="Explorer"
        top="130px"
        left="30px"
        onDoubleClick={() => {
          setExplorerOpen(true);
          setExplorerMinimized(false);
        }}
      />

      <DesktopIcon
        icon={<img src={calculatorIcon} alt="" width="40" />}
        label="Calculator"
        top="230px"
        left="30px"
        onDoubleClick={() => {
          setCalcOpen(true);
          setCalcMinimized(false);
        }}
      />

      <DesktopIcon
        icon={<img src={rocketIcon} alt="" width="40" />}
        label="Nova Command"
        top="430px"
        left="30px"
        onDoubleClick={() => {
          setCommandOpen(true);
          setCommandMinimized(false);
        }}
      />

      <DesktopIcon
        icon={<img src={settingsIcon} alt="" width="40" />}
        label="Settings"
        top="530px"
        left="30px"
        onDoubleClick={() => {
          setSettingsOpen(true);
          setSettingsMinimized(false);
        }}
      />
      <DesktopIcon
  icon={
    <img
      src={musicIcon}
      alt=""
      width="40"
    />
  }
  label="Nova Music"
  top="630px"
  left="30px"
  onDoubleClick={() => {
    setMusicOpen(true);
    setMusicMinimized(false);
  }}
/>
      {settingsOpen && !settingsMinimized && (
        <Window
          title="Settings"
          top="140px"
          left="220px"
          width="900px"
          height="600px"
          zIndex={40}
          onClose={() => setSettingsOpen(false)}
          onMinimize={() => setSettingsMinimized(true)}
        >
         <Settings
  wallpaper={wallpaper}
  setWallpaper={setWallpaper}
  showToast={showToast}
/>
        </Window>
      )}

      {notesOpen && !notesMinimized && (
        <Window
          title="Notes"
          top="100px"
          left="180px"
          width="650px"
          height="420px"
          zIndex={zIndexes.notes}
          onFocus={() => bringToFront("notes")}
          onClose={() => setNotesOpen(false)}
          onMinimize={() => setNotesMinimized(true)}
        >
          <Notes />
        </Window>
      )}

      {explorerOpen && !explorerMinimized && (
        <Window
          title="Explorer"
          top="140px"
          left="520px"
          width="550px"
          height="380px"
          zIndex={zIndexes.explorer}
          onFocus={() => bringToFront("explorer")}
          onClose={() => setExplorerOpen(false)}
          onMinimize={() => setExplorerMinimized(true)}
        >
          <Explorer />
        </Window>
      )}

      {calcOpen && !calcMinimized && (
        <Window
          title="Calculator"
          top="180px"
          left="350px"
          width="360px"
          height="500px"
          zIndex={zIndexes.calc}
          onFocus={() => bringToFront("calc")}
          onClose={() => setCalcOpen(false)}
          onMinimize={() => setCalcMinimized(true)}
        >
          <Calculator />
        </Window>
      )}

      {commandOpen && !commandMinimized && (
        <Window
          title="NOVA COMMAND"
          top="60px"
          left="120px"
          width="1000px"
          height="650px"
          zIndex={zIndexes.command}
          onFocus={() => bringToFront("command")}
          onClose={() => setCommandOpen(false)}
          onMinimize={() => setCommandMinimized(true)}
        >
          <NovaCommand />
        </Window>
      )}

      {startOpen && <StartMenu />}

      <Taskbar
        setHubOpen={setHubOpen}
        hubOpen={hubOpen}
        openApps={taskbarApps}
        focusApp={(app) => {
          if (app === "Notes") {
            setNotesMinimized(false);
            bringToFront("notes");
          }

          if (app === "Explorer") {
            setExplorerMinimized(false);
            bringToFront("explorer");
          }

          if (app === "Calculator") {
            setCalcMinimized(false);
            bringToFront("calc");
          }

          if (app === "Nova AI") {
            setNovaMinimized(false);
            setNovaOpen(true);
          }

          if (app === "Nova Command") {
            setCommandMinimized(false);
            setCommandOpen(true);
            bringToFront("command");
          }

          if (app === "Settings") {
            setSettingsMinimized(false);
            setSettingsOpen(true);
          }
          if (app === "Nova Music") {
  setMusicMinimized(false);
  setMusicOpen(true);
}
        }}
      />

      {novaOpen && !novaMinimized && (
        <Window
          title="Nova AI"
          top="120px"
          left="250px"
          width="700px"
          height="500px"
          zIndex={30}
          onClose={() => setNovaOpen(false)}
          onMinimize={() => setNovaMinimized(true)}
        >
          <NovaAI />
        </Window>
      )}
      {musicOpen &&
 !musicMinimized && (
  <Window
    title="Nova Music"
    top="100px"
    left="300px"
    width="700px"
    height="650px"
    zIndex={32}
    onClose={() =>
      setMusicOpen(false)
    }
    onMinimize={() =>
      setMusicMinimized(true)
    }
  >
    <NovaMusic />
  </Window>
)}
      {hubOpen && (
        <NovaHub
          onClose={() => setHubOpen(false)}
          openSettings={() => {
            setSettingsOpen(true);
            setSettingsMinimized(false);
            setHubOpen(false);
          }}
          openNotes={() => {
            setNotesOpen(true);
            setNotesMinimized(false);
            setHubOpen(false);
          }}
          openExplorer={() => {
            setExplorerOpen(true);
            setExplorerMinimized(false);
            setHubOpen(false);
          }}
          openCalculator={() => {
            setCalcOpen(true);
            setCalcMinimized(false);
            setHubOpen(false);
          }}
          openNovaAI={() => {
            setNovaOpen(true);
            setNovaMinimized(false);
            setHubOpen(false);
          }}
          openNovaCommand={() => {
            setCommandOpen(true);
            setCommandMinimized(false);
            setHubOpen(false);
          }}
          onSleep={() => {
            setSleeping(true);
          }}
          onRestart={() => {
            setBooting(true);

            setTimeout(() => {
              setBooting(false);
            }, 9000);
          }}
          onShutdown={() => {
            setShutdown(true);
          }}
          onEmergency={() => {
            setEmergencyMode(true);
            setHubOpen(false);
          }}
          openNovaMusic={() => {
  setMusicOpen(true);
  setMusicMinimized(false);
  setHubOpen(false);
}}
        />
      )}
      {toast && (
  <Toast
    title={toast.title}
    message={toast.message}
    onClose={() =>
      setToast(null)
    }
  />
)}
    </div>
  );
}

export default App;
