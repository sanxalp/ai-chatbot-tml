import { useState } from "react";
import type { FormEvent } from "react";
import "./App.css";

//state management
interface Message {
  sender: "user" | "bot";
  text: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    setMessages((msgs) => [...msgs, { sender: "user", text: input }]);
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      setMessages((msgs) => [
        ...msgs,
        // { sender: "user", text: input },
        { sender: "bot", text: data.response },
      ]);
    } catch (error) {
      setMessages((msgs) => [
        ...msgs,
        // { sender: "user", text: input },
        { sender: "bot", text: "Error: Could not reach backend." },
      ]);
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <h2>Chatbot</h2>
      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.sender}`}>
            <b>{msg.sender === "user" ? "You" : "Bot"}:</b> {msg.text}
          </div>
        ))}
        {loading && <div className="message bot">Bot is typing...</div>}
      </div>
      <form className="chat-input" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
