import { useState, useEffect } from "react";

function Notes() {
  const [notes, setNotes] = useState(() => {
    const saved =
      localStorage.getItem("nova-notes-v2");

    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            title: "Welcome",
            content:
              "Welcome to NovaOS Notes.",
            updated: Date.now(),
          },
        ];
  });

  const [selectedId, setSelectedId] =
    useState(notes[0].id);

  const [search, setSearch] =
    useState("");

  useEffect(() => {
    localStorage.setItem(
      "nova-notes-v2",
      JSON.stringify(notes)
    );
  }, [notes]);

  const selectedNote =
    notes.find(
      (note) => note.id === selectedId
    ) || notes[0];

  const createNote = () => {
    const newNote = {
      id: Date.now(),
      title: "New Note",
      content: "",
      updated: Date.now(),
    };

    setNotes([newNote, ...notes]);
    setSelectedId(newNote.id);
  };

  const deleteNote = () => {
    if (notes.length === 1) return;

    const updated =
      notes.filter(
        (note) =>
          note.id !== selectedId
      );

    setNotes(updated);
    setSelectedId(updated[0].id);
  };

  const updateContent = (value) => {
    setNotes(
      notes.map((note) =>
        note.id === selectedId
          ? {
              ...note,
              content: value,
              title:
                value.split("\n")[0] ||
                "Untitled",
              updated: Date.now(),
            }
          : note
      )
    );
  };

  const filteredNotes =
    notes.filter((note) =>
      note.title
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  const words =
    selectedNote?.content
      ?.trim()
      ?.split(/\s+/)
      ?.filter(Boolean).length || 0;

  const chars =
    selectedNote?.content?.length || 0;

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        color: "white",
      }}
    >
      {/* SIDEBAR */}

      <div
        style={{
          width: "240px",
          borderRight:
            "1px solid rgba(255,255,255,.08)",
          padding: "12px",
        }}
      >
        <button
          onClick={createNote}
          style={{
            width: "100%",
            padding: "10px",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            marginBottom: "10px",
            background:
              "rgba(79,70,229,.8)",
            color: "white",
          }}
        >
          + New Note
        </button>

        <input
          placeholder="Search..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            border: "none",
            borderRadius: "10px",
            marginBottom: "12px",
            background:
              "rgba(255,255,255,.08)",
            color: "white",
          }}
        />

        {filteredNotes.map((note) => (
          <div
            key={note.id}
            onClick={() =>
              setSelectedId(note.id)
            }
            style={{
              padding: "10px",
              borderRadius: "10px",
              marginBottom: "6px",
              cursor: "pointer",
              background:
                selectedId === note.id
                  ? "rgba(79,70,229,.25)"
                  : "rgba(255,255,255,.04)",
            }}
          >
            {note.title}
          </div>
        ))}
      </div>

      {/* EDITOR */}

      <div
        style={{
          flex: 1,
          padding: "15px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            marginBottom: "10px",
          }}
        >
          <div>
            Last Edited:
            {" "}
            {new Date(
              selectedNote.updated
            ).toLocaleTimeString()}
          </div>

          <button
            onClick={deleteNote}
            style={{
              border: "none",
              padding:
                "8px 12px",
              borderRadius: "8px",
              cursor: "pointer",
              background:
                "rgba(239,68,68,.8)",
              color: "white",
            }}
          >
            Delete
          </button>
        </div>

        <textarea
          value={
            selectedNote.content
          }
          onChange={(e) =>
            updateContent(
              e.target.value
            )
          }
          placeholder="Start writing..."
          style={{
            flex: 1,
            resize: "none",
            border: "none",
            outline: "none",
            borderRadius: "12px",
            padding: "15px",
            background:
              "rgba(255,255,255,.06)",
            color: "white",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            marginTop: "10px",
            opacity: .7,
            fontSize: "13px",
          }}
        >
          <span>
            Words: {words}
          </span>

          <span>
            Characters: {chars}
          </span>
        </div>
      </div>
    </div>
  );
}

export default Notes;