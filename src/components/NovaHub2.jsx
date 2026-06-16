import { useState } from "react";

import sleepIcon from "../icons/sleep.svg";
import restartIcon from "../icons/restart.svg";
import novaLogo from "../icons/nova-logo.svg";
import notesIcon from "../icons/notes.svg";
import folderIcon from "../icons/folder.svg";
import calculatorIcon from "../icons/calculator.svg";
import novaAIIcon from "../icons/nova-ai.svg";
import rocketIcon from "../icons/rocket.svg";
import settingsIcon from "../icons/settings.svg";
import musicIcon from "../icons/novamusic.svg";

function NovaHub({
  onClose,
  openNotes,
  openExplorer,
  openCalculator,
  openNovaAI,
  openNovaCommand,
  openNovaMusic,
  openSettings,
  onSleep,
  onRestart,
  onShutdown,
  onEmergency,
}) {
  const [powerOpen, setPowerOpen] =
    useState(false);

  return (
    <div
      className="nova-hub-overlay"
      onClick={onClose}
    >
      <div
        className="nova-hub"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="hub-header">
          <img
            src={novaLogo}
            alt="NovaOS"
            className="hub-logo"
          />

          <div>
            <h2>NovaOS</h2>
            <span>
              Bridge Interface
            </span>
          </div>
        </div>

        <input
          className="hub-search"
          placeholder="Search systems..."
        />

        <div className="hub-app-grid">

          <div
            className="hub-app"
            onClick={() => {
              openNovaCommand();
              onClose();
            }}
          >
            <img
              src={rocketIcon}
              alt=""
            />
            <span>
              Nova Command
            </span>
          </div>

          <div
            className="hub-app"
            onClick={() => {
              openNovaAI();
              onClose();
            }}
          >
            <img
              src={novaAIIcon}
              alt=""
            />
            <span>
              Nova AI
            </span>
          </div>

          <div
            className="hub-app"
            onClick={() => {
              openExplorer();
              onClose();
            }}
          >
            <img
              src={folderIcon}
              alt=""
            />
            <span>
              Explorer
            </span>
          </div>

          <div
            className="hub-app"
            onClick={() => {
              openNotes();
              onClose();
            }}
          >
            <img
              src={notesIcon}
              alt=""
            />
            <span>
              Notes
            </span>
          </div>

          <div
            className="hub-app"
            onClick={() => {
              openCalculator();
              onClose();
            }}
          >
            <img
              src={calculatorIcon}
              alt=""
            />
            <span>
              Calculator
            </span>
          </div>

          <div
            className="hub-app"
            onClick={() => {
              openSettings();
              onClose();
            }}
          >
            <img
              src={settingsIcon}
              alt=""
            />
            <span>
              Settings
            </span>
          </div>

          <div
            className="hub-app"
            onClick={() => {
              openNovaMusic();
              onClose();
            }}
          >
            <img
              src={musicIcon}
              alt=""
            />
            <span>
              Nova Music
            </span>
          </div>

        </div>

        <div className="hub-footer">

          <div className="hub-user">
            Captain
          </div>

          <div className="power-menu-container">

            <button
              className="power-toggle"
              onClick={() =>
                setPowerOpen(!powerOpen)
              }
            >
              ☰
            </button>

            {powerOpen && (
              <div className="power-menu">

                <button
                  onClick={() => {
                    onSleep?.();
                    setPowerOpen(false);
                    onClose();
                  }}
                >
                  <img
                    src={sleepIcon}
                    alt=""
                  />
                  Sleep
                </button>

                <button
                  onClick={() => {
                    onRestart?.();
                    setPowerOpen(false);
                    onClose();
                  }}
                >
                  <img
                    src={restartIcon}
                    alt=""
                  />
                  Restart
                </button>

                <button
                  onClick={() => {
                    onShutdown?.();
                    setPowerOpen(false);
                    onClose();
                  }}
                >
                  ⏻ Shutdown
                </button>

                <button
                  className="emergency-btn"
                  onClick={() => {
                    onEmergency?.();
                    setPowerOpen(false);
                    onClose();
                  }}
                >
                  ⚠ Emergency Mode
                </button>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default NovaHub;