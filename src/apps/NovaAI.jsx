import { useState } from "react";

function NovaAI() {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello Commander. Nova AI online.",
    },
  ]);

  const [input, setInput] = useState("");

  const replies = [
    "Navigation systems online.",
    "All NovaOS systems operational.",
    "Scanning nearby sectors...",
    "Mission status: Stable.",
    "Awaiting further instructions, Commander.",
  ];

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages([
      ...messages,
      {
        sender: "user",
        text: input,
      },
      {
        sender: "ai",
        text: replies[Math.floor(Math.random() * replies.length)],
      },
    ]);

    setInput("");
  };

  return (
    <div className="nova-ai">

      <div className="nova-chat">

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.sender}`}
          >
            {msg.text}
          </div>
        ))}

      </div>

      <div className="nova-input-bar">

        <input
          value={input}
          onChange={(e) =>
            setInput(e.target.value)
          }
          placeholder="Ask Nova AI..."
        />

        <button
          onClick={sendMessage}
        >
          Send
        </button>

      </div>

    </div>
  );
}

export default NovaAI;