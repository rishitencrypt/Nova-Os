import { useState } from "react";

function Calculator() {
  const [input, setInput] = useState("");

  const calculate = () => {
    try {
      const result = Function(
        `"use strict"; return (${input})`
      )();

      setInput(String(result));
    } catch {
      setInput("Error");
    }
  };

  const handleClick = (value) => {
    if (value === "=") {
      calculate();
      return;
    }

    if (value === "C") {
      setInput("");
      return;
    }

    setInput((prev) => prev + value);
  };

  const buttons = [
    "7", "8", "9", "/",
    "4", "5", "6", "*",
    "1", "2", "3", "-",
    "0", ".", "=", "+"
  ];

  return (
    <div>
      <input
        value={input}
        readOnly
        className="calc-display"
      />

      <div className="calc-grid">
        <button
          className="calc-clear"
          onClick={() => handleClick("C")}
        >
          C
        </button>

        {buttons.map((btn) => (
          <button
            key={btn}
            onClick={() => handleClick(btn)}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Calculator;