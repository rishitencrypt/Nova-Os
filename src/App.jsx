import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";

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
import ShipStatus from "./components/ShipStatus";
import CursorShip from "./components/CursorShip";
import AlienPet from "./components/AlienPet";
import GettingStarted from "./components/GettingStarted";
import StellarNavigation from "./apps/StellarNavigation";

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
  const [musicOpen, setMusicOpen] = useState(false);
  const [musicMinimized, setMusicMinimized] = useState(false);
  const [stellarOpen, setStellarOpen] = useState(false);
  const [stellarMinimized, setStellarMinimized] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((title, message) => {
    const audio = new Audio(notificationSound);
    audio.volume = 0.5;
    audio.play().catch(() => {});
    setToast({ title, message });
  }, []);

  /* ----- Desktop right-click context menu ----- */
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0 });
  const desktopRef = useRef(null);
  const contextMenuRef = useRef(null);
  const [contextMenuOffset, setContextMenuOffset] = useState({ x: 0, y: 0 });

  /* Reposition menu near screen edges to avoid overflow (after layout) */
  useLayoutEffect(() => {
    if (!contextMenu.open || !contextMenuRef.current) {
      setContextMenuOffset({ x: 0, y: 0 });
      return;
    }
    const rect = contextMenuRef.current.getBoundingClientRect();
    const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
    const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
    const margin = 8;

    let offX = 0;
    let offY = 0;
    if (contextMenu.x + rect.width + margin > vw) {
      offX = vw - rect.width - margin - contextMenu.x;
    }
    if (contextMenu.y + rect.height + margin > vh) {
      offY = vh - rect.height - margin - contextMenu.y;
    }
    setContextMenuOffset({ x: offX, y: offY });
  }, [contextMenu.open, contextMenu.x, contextMenu.y]);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => (prev.open ? { ...prev, open: false } : prev));
  }, []);

  const handleRefresh = useCallback(() => {
    showToast("Desktop", "Refreshed.");
  }, [showToast]);

  const handleNewFolder = useCallback(() => {
    showToast("New Folder", "Folder created on desktop.");
  }, [showToast]);

  const handleNewNote = useCallback(() => {
    setNotesOpen(true);
    setNotesMinimized(false);
  }, []);

  const handleChangeWallpaper = useCallback(() => {
    setSettingsOpen(true);
    setSettingsMinimized(false);
  }, []);

  const handleOpenNovaAI = useCallback(() => {
    setNovaOpen(true);
    setNovaMinimized(false);
  }, []);

  const handleSystemInfo = useCallback(() => {
    const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
    const tail = ua ? ua.split(" ").pop() : "unknown";
    showToast("System Info", `NovaOS · ${tail}`);
  }, [showToast]);

  const handleRestart = useCallback(() => {
    setBooting(true);
    setTimeout(() => setBooting(false), 9000);
  }, []);

  const contextMenuItems = useMemo(
    () => [
      { label: "Refresh", action: handleRefresh },
      { label: "New Folder", action: handleNewFolder },
      { label: "New Note", action: handleNewNote },
      { label: "Change Wallpaper", action: handleChangeWallpaper },
      { label: "Open Nova AI", action: handleOpenNovaAI },
      {
        label: "Settings",
        action: () => {
          setSettingsOpen(true);
          setSettingsMinimized(false);
        },
      },
      { label: "System Info", action: handleSystemInfo },
      { label: "Restart NovaOS", action: handleRestart },
    ],
    [
      handleRefresh,
      handleNewFolder,
      handleNewNote,
      handleChangeWallpaper,
      handleOpenNovaAI,
      handleSystemInfo,
      handleRestart,
    ]
  );

  const [wallpaper, setWallpaper] = useState(() => {
    return localStorage.getItem("nova-wallpaper") || "default";
  });

  const [showWelcome, setShowWelcome] = useState(() => {
    return localStorage.getItem("nova-onboarding-complete") !== "true";
  });

  const [startOpen] = useState(false);

  const [pinnedApps] = useState(() => {
    const savedPins = localStorage.getItem("novaPins");
    return savedPins
      ? JSON.parse(savedPins)
      : [
          { name: "Explorer", icon: folderIcon },
          { name: "Nova AI", icon: novaAIIcon },
          { name: "Nova Command", icon: rocketIcon },
        ];
  });

  const [zIndexes, setZIndexes] = useState({
    notes: 20,
    explorer: 21,
    calc: 22,
    command: 23,
    stellar: 24,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setBooting(false);
    }, 9000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem("nova-welcome-shown");
    if (!seen) {
      setTimeout(() => {
        showToast(
          "Welcome to NovaOS",
          "Open Settings to customize wallpapers and system preferences."
        );
      }, 1500);
      localStorage.setItem("nova-welcome-shown", "true");
    }
  }, [showToast]);

  /* ----- Context menu: open on desktop right-click, suppress browser menu ----- */
  useEffect(() => {
    const onContextMenu = (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const desktopEl = desktopRef.current;
      if (!desktopEl || !desktopEl.contains(target)) return;

      // Always suppress the browser's native context menu while on the desktop
      e.preventDefault();

      // Only open the custom menu when right-clicking empty desktop surface
      const isEmptySurface =
        target.classList.contains("desktop") ||
        target.classList.contains("video-background") ||
        target.closest('[data-desktop-surface="true"]') === desktopEl ||
        (target.hasAttribute &&
          target.getAttribute("data-desktop-surface") === "true");

      if (!isEmptySurface) return;

      setContextMenu({ open: true, x: e.clientX, y: e.clientY });
    };

    window.addEventListener("contextmenu", onContextMenu);
    return () => window.removeEventListener("contextmenu", onContextMenu);
  }, []);

  /* ----- Context menu: close on outside click, escape, scroll, or blur ----- */
  useEffect(() => {
    if (!contextMenu.open) return;

    const onPointerDown = (e) => {
      const target = e.target;
      if (
        target instanceof Element &&
        target.closest(".desktop-context-menu")
      ) {
        return;
      }
      closeContextMenu();
    };

    const onEscape = (e) => {
      if (e.key === "Escape") closeContextMenu();
    };

    const onScroll = () => closeContextMenu();
    const onBlur = () => closeContextMenu();

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onEscape);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onEscape);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("blur", onBlur);
    };
  }, [contextMenu.open, closeContextMenu]);

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
      ? [{ name: "Notes", icon: notesIcon }]
      : []),
    ...(explorerOpen && !pinnedApps.some((app) => app.name === "Explorer")
      ? [{ name: "Explorer", icon: folderIcon }]
      : []),
    ...(calcOpen && !pinnedApps.some((app) => app.name === "Calculator")
      ? [{ name: "Calculator", icon: calculatorIcon }]
      : []),
    ...(novaOpen && !pinnedApps.some((app) => app.name === "Nova AI")
      ? [{ name: "Nova AI", icon: novaAIIcon }]
      : []),
    ...(commandOpen && !pinnedApps.some((app) => app.name === "Nova Command")
      ? [{ name: "Nova Command", icon: rocketIcon }]
      : []),
    ...(settingsOpen && !pinnedApps.some((app) => app.name === "Settings")
      ? [{ name: "Settings", icon: settingsIcon }]
      : []),
    ...(musicOpen && !pinnedApps.some((app) => app.name === "Nova Music")
      ? [{ name: "Nova Music", icon: musicIcon }]
      : []),
    ...(stellarOpen &&
    !pinnedApps.some((app) => app.name === "Stellar Navigation")
      ? [{ name: "Stellar Navigation", icon: rocketIcon }]
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
      ref={desktopRef}
      className={`desktop ${emergencyMode ? "emergency-mode" : ""}`}
      data-desktop-surface="true"
    >
      <VideoBackground wallpaperName={wallpaper} />

      {showWelcome && (
        <GettingStarted
          onContinue={() => {
            localStorage.setItem("nova-onboarding-complete", "true");
            setShowWelcome(false);
            showToast("Bridge Online", "Welcome to NovaOS.");
          }}
        />
      )}

      {emergencyMode && (
        <div className="alert-banner">
          ⚠ RED ALERT — EMERGENCY PROTOCOL ACTIVE
        </div>
      )}

      <OrbitalWidget />
      <CursorShip />

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
        icon={<img src={musicIcon} alt="" width="40" />}
        label="Nova Music"
        top="630px"
        left="30px"
        onDoubleClick={() => {
          setMusicOpen(true);
          setMusicMinimized(false);
        }}
      />

      <DesktopIcon
        icon={<img src={rocketIcon} alt="" width="40" />}
        label="Stellar Navigation"
        top="730px"
        left="30px"
        onDoubleClick={() => {
          setStellarOpen(true);
          setStellarMinimized(false);
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
  top="80px"
  left="150px"
  width="1100px"
  height="700px"
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

      {stellarOpen && !stellarMinimized && (
        <Window
          title="Stellar Navigation"
          top="30px"
          left="80px"
          width="1200px"
          height="760px"
          zIndex={zIndexes.stellar}
          onFocus={() => bringToFront("stellar")}
          onClose={() => setStellarOpen(false)}
          onMinimize={() => setStellarMinimized(true)}
        >
          <StellarNavigation />
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
          if (app === "Stellar Navigation") {
            setStellarMinimized(false);
            setStellarOpen(true);
            bringToFront("stellar");
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

      {musicOpen && !musicMinimized && (
        <Window
          title="Nova Music"
          top="100px"
          left="300px"
          width="700px"
          height="650px"
          zIndex={32}
          onClose={() => setMusicOpen(false)}
          onMinimize={() => setMusicMinimized(true)}
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
          onSleep={() => setSleeping(true)}
          onRestart={() => {
            setBooting(true);
            setTimeout(() => setBooting(false), 9000);
          }}
          onShutdown={() => setShutdown(true)}
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

      <ShipStatus />

      <AlienPet
        musicOpen={musicOpen}
        novaOpen={novaOpen}
        explorerOpen={explorerOpen}
        settingsOpen={settingsOpen}
      />

      {toast && (
        <Toast
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Desktop right-click context menu */}
      {contextMenu.open && (
        <div
          ref={contextMenuRef}
          className="desktop-context-menu"
          role="menu"
          aria-label="Desktop context menu"
          style={{
            left: `${contextMenu.x + contextMenuOffset.x}px`,
            top: `${contextMenu.y + contextMenuOffset.y}px`,
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {contextMenuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className="desktop-context-menu-item"
              onClick={() => {
                closeContextMenu();
                setTimeout(() => item.action(), 0);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
