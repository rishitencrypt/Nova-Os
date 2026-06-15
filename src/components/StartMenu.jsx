import notesIcon from "../icons/notes.svg";
import folderIcon from "../icons/folder.svg";
import calculatorIcon from "../icons/calculator.svg";

function StartMenu({
  openNotes,
  openExplorer,
  openCalculator,
}) {
  return (
    <div className="start-menu">

      <h2>NovaOS</h2>

      <div
        className="menu-item"
        onClick={openNotes}
      >
        <img
          src={notesIcon}
          alt="Notes"
          width="24"
        />
        <span>Notes</span>
      </div>

      <div
        className="menu-item"
        onClick={openExplorer}
      >
        <img
          src={folderIcon}
          alt="Explorer"
          width="24"
        />
        <span>Explorer</span>
      </div>

      <div
        className="menu-item"
        onClick={openCalculator}
      >
        <img
          src={calculatorIcon}
          alt="Calculator"
          width="24"
        />
        <span>Calculator</span>
      </div>

    </div>
  );
}

export default StartMenu;