import { useState } from "react";

function Notes() {
  const [text, setText] = useState(
    () => localStorage.getItem("nova-notes") || ""
  );

  const handleChange = (e) => {
    const value = e.target.value;

    setText(value);
    localStorage.setItem("nova-notes", value);
  };

  return (
    <textarea
      value={text}
      onChange={handleChange}
      placeholder="Write your notes..."
      style={{
        width: "100%",
        height: "150px",
        background: "#111827",
        color: "white",
        border: "none",
        outline: "none",
        resize: "none",
        padding: "10px",
        borderRadius: "8px",
      }}
    />
  );
}

export default Notes;