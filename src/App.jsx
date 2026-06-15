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

import CelestialClock from "./components/CelestialClock";
function App() {
  const [booting, setBooting] = useState(true);

  const [notesOpen, setNotesOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [commandOpen, setCommandOpen] =
  useState(false);

const [commandMinimized, setCommandMinimized] =
  useState(false);
  const [notesMinimized, setNotesMinimized] = useState(false);
  const [explorerMinimized, setExplorerMinimized] = useState(false);
  const [calcMinimized, setCalcMinimized] = useState(false);
  const [novaOpen, setNovaOpen] =
  useState(false);

const [novaMinimized, setNovaMinimized] =
  useState(false);
  
  const [startOpen, setStartOpen] = useState(false);

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

  const bringToFront = (windowName) => {
    const highest = Math.max(...Object.values(zIndexes));

    setZIndexes((prev) => ({
      ...prev,
      [windowName]: highest + 1,
    }));
  };

  if (booting) {
    return <BootScreen />;
  }

  return (
    <div className="desktop">
      <VideoBackground />
      <>
  <CelestialClock />
  <OrbitalWidget />
</>
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
  icon={
    <img
      src={novaAIIcon}
      alt=""
      width="40"
    />
  }
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
  icon={
    <img
      src={rocketIcon}
      alt=""
      width="40"
    />
  }
  label="Nova Command"
  top="430px"
  left="30px"
  onDoubleClick={() => {
    setCommandOpen(true);
    setCommandMinimized(false);
  }}
/>

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
      {commandOpen &&
 !commandMinimized && (
  <Window
    title="NOVA COMMAND"
    top="60px"
    left="120px"
    width="1000px"
    height="650px"
    zIndex={zIndexes.command}
    onFocus={() =>
      bringToFront("command")
    }
    onClose={() =>
      setCommandOpen(false)
    }
    onMinimize={() =>
      setCommandMinimized(true)
    }
  >
    <NovaCommand />
  </Window>
)}

      {startOpen && (
        <StartMenu
          openNotes={() => {
            setNotesOpen(true);
            setNotesMinimized(false);
            setStartOpen(false);
          }}
          openExplorer={() => {
            setExplorerOpen(true);
            setExplorerMinimized(false);
            setStartOpen(false);
          }}
          openCalculator={() => {
            setCalcOpen(true);
            setCalcMinimized(false);
            setStartOpen(false);
          }}
        />
      )}

      <Taskbar
        toggleStart={() => setStartOpen(!startOpen)}
        openApps={[
          ...(notesOpen
            ? [{ name: "Notes", icon: notesIcon }]
            : []),

          ...(explorerOpen
            ? [{ name: "Explorer", icon: folderIcon }]
            : []),
            ...(commandOpen
  ? [{
      name: "Nova Command",
      icon: rocketIcon,
    }]
  : []),
          ...(calcOpen
            ? [{ name: "Calculator", icon: calculatorIcon }]
            : []),
        ]}
        
        focusApp={(app) => {
          if (app === "Notes") {
            setNotesMinimized(false);
            bringToFront("notes");
          }

          if (app === "Explorer") {
            setExplorerMinimized(false);
            bringToFront("explorer");
          }
          if (app === "Nova Command") {
  setCommandMinimized(false);
  bringToFront("command");
}
          if (app === "Calculator") {
            setCalcMinimized(false);
            bringToFront("calc");
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
    onMinimize={() =>
      setNovaMinimized(true)
    }
  >
    <NovaAI />
  </Window>
)}
    </div>
  );
}

export default App;