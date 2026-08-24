import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
function AIAgent() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hello! I'm CloudMind AI. Ask me anything about cloud computing, infrastructure, security, cost optimization, load balancing, energy efficiency, or cloud providers."
    }
  ]);

  const suggestions = [
    "Why is my cloud cost increasing?",
    "Explain load balancing",
    "Which cloud provider is best for my application?",
    "How can I improve cloud security?",
    "How can I reduce energy consumption?"
  ];
const useSuggestion = (suggestion) => {
  setMessage(suggestion);
};
const sendMessage = async () => {
  if (!message.trim()) return;

  const userMessage = message.trim();

  setMessages((prev) => [
    ...prev,
    {
      role: "user",
      text: userMessage
    }
  ]);

  setMessage("");

  try {

    const response = await fetch(
      "https://cloudmind-backend.onrender.com/api/chat",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message: userMessage
        })
      }
    );


    const data = await response.json();


    if (!response.ok) {
      throw new Error(
        data.detail || "AI request failed"
      );
    }


    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: data.answer
      }
    ]);

  } catch (error) {

    console.error(error);

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text:
          "⚠️ I couldn't connect to the AI backend. " +
          "Please make sure the FastAPI server is running."
      }
    ]);

  }
};

  return (
    <div className="ai-page">

      {/* HEADER */}

      <div className="ai-header">

        <div>
          <div className="eyebrow">
            CLOUD INTELLIGENCE
          </div>

          <h1>AI Cloud Agent</h1>

          <p>
            Your intelligent assistant for cloud infrastructure,
            optimization and security.
          </p>
        </div>

        <div className="agent-status">
          <span className="agent-status-dot"></span>
          AI Online
        </div>

      </div>


      {/* AI WORKSPACE */}

      <div className="ai-workspace">

        {/* CHAT */}

        <div className="chat-panel">

          <div className="chat-header">

            <div className="ai-avatar">
              ✦
            </div>

            <div>
              <strong>CloudMind AI</strong>
              <span>Cloud Intelligence Agent</span>
            </div>

          </div>


          <div className="messages">

            {messages.map((msg, index) => (

              <div
                key={index}
                className={`message-row ${msg.role}`}
              >

                {msg.role === "ai" && (
                  <div className="small-ai-avatar">
                    ✦
                  </div>
                )}

                <div className="message-bubble">
                   {msg.role === "ai" ? (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {msg.text}
    </ReactMarkdown>
  ) : (
    msg.text
  )}
                </div>

              </div>

            ))}

          </div>


          {/* SUGGESTIONS */}

          <div className="suggestions">

            <span>Try asking</span>

            <div className="suggestion-list">

              {suggestions.map((suggestion, index) => (

                <button
                  key={index}
                  onClick={() => useSuggestion(suggestion)}
                >
                  {suggestion}
                </button>

              ))}

            </div>

          </div>


          {/* INPUT */}

          <div className="chat-input-area">

            <div className="chat-input">

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask anything about cloud computing..."
                rows="1"
              />

              <button
                className="send-button"
                onClick={sendMessage}
              >
                ↑
              </button>

            </div>

            <span className="input-hint">
              Press Enter to send · Shift + Enter for new line
            </span>

          </div>

        </div>


        {/* RIGHT SIDE */}

        <div className="ai-side-panel">

          <div className="ai-card">

            <div className="ai-card-title">
              <span>✦</span>
              Agent Capabilities
            </div>

            <div className="capability">
              <div className="capability-icon">☁</div>

              <div>
                <strong>Cloud Knowledge</strong>
                <span>
                  AWS, Azure, GCP & cloud concepts
                </span>
              </div>
            </div>


            <div className="capability">
              <div className="capability-icon">⚖</div>

              <div>
                <strong>Infrastructure Analysis</strong>
                <span>
                  Analyze workloads and resources
                </span>
              </div>
            </div>


            <div className="capability">
              <div className="capability-icon">🔐</div>

              <div>
                <strong>Security Intelligence</strong>
                <span>
                  Identify cloud security risks
                </span>
              </div>
            </div>


            <div className="capability">
              <div className="capability-icon">₹</div>

              <div>
                <strong>Cost Optimization</strong>
                <span>
                  Find potential cloud savings
                </span>
              </div>
            </div>


            <div className="capability">
              <div className="capability-icon">ϟ</div>

              <div>
                <strong>Energy Optimization</strong>
                <span>
                  Improve infrastructure efficiency
                </span>
              </div>
            </div>

          </div>


          <div className="ai-card">

            <div className="ai-card-title">
              <span>◈</span>
              Connected Intelligence
            </div>

            <div className="connection">

              <span className="connection-dot"></span>

              <div>
                <strong>Cloud Metrics</strong>
                <span>Connected</span>
              </div>

            </div>


            <div className="connection">

              <span className="connection-dot"></span>

              <div>
                <strong>Security Engine</strong>
                <span>Connected</span>
              </div>

            </div>


            <div className="connection">

              <span className="connection-dot"></span>

              <div>
                <strong>Cost Engine</strong>
                <span>Connected</span>
              </div>

            </div>


            <div className="connection">

              <span className="connection-dot"></span>

              <div>
                <strong>Analytics Engine</strong>
                <span>Connected</span>
              </div>

            </div>

          </div>


          <div className="agent-info">

            <span>✦</span>

            <div>
              <strong>Agent Mode</strong>

              <p>
                CloudMind AI will eventually be able to
                call specialized tools to analyze your
                infrastructure and provide data-driven
                recommendations.
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default AIAgent;
