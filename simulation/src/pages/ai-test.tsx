import Head from "next/head";
import { useState } from "react";
import { ApiKeyModal } from "../components/ApiKeyModal";
import { Claude } from "../lib/llm";

export default function AITest() {
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);

  // Tool calling test state
  const [toolResponse, setToolResponse] = useState<string>("");
  const [toolLoading, setToolLoading] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [toolCalls, setToolCalls] = useState<any[]>([]);
  const [showChatHistory, setShowChatHistory] = useState<boolean>(false);

  const handleAICall = async () => {
    if (!apiKey.trim()) {
      setError("Please enter your Anthropic API key");
      return;
    }

    setLoading(true);
    setError("");
    setResponse("");

    try {
      // Use client-side Claude instance
      const claude = new Claude(apiKey);
      const response = await claude.useLLM(
        null,
        "Suggest 3 cool names for a dragon"
      );

      setResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleToolTest = async () => {
    if (!apiKey.trim()) {
      setError("Please enter your Anthropic API key");
      return;
    }

    setToolLoading(true);
    setError("");
    setToolResponse("");
    setChatHistory([]);
    setToolCalls([]);

    try {
      // Use client-side Claude instance for simple testing
      const claude = new Claude(apiKey);
      const result = await claude.useLLM(
        "You are a board game AI assistant.",
        "I need to move my champion from position (1,1) to position (2,3) and then harvest some resources. Describe what actions you would take as a strategic AI player."
      );

      setToolResponse(result);
      setChatHistory([
        { role: "user", content: "Test message", ts: new Date() },
        { role: "assistant", content: result, ts: new Date() },
      ]);
      setToolCalls([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setToolLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>AI Test - Lords of Doomspire</title>
        <meta name="description" content="AI functionality test page" />
      </Head>

      <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
        <h1>AI Test Page</h1>
        <p>
          Test the AI functionality including basic text generation and tool
          calling.
        </p>

        <div style={{ marginBottom: "2rem" }}>
          <button
            onClick={() => setShowApiKeyModal(true)}
            style={{
              padding: "8px 16px",
              backgroundColor: apiKey ? "#28a745" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            🔑 {apiKey ? "API Key Set" : "Set API Key"}
          </button>

          <button
            onClick={() => setShowChatHistory(!showChatHistory)}
            style={{
              padding: "8px 16px",
              backgroundColor: showChatHistory ? "#ffc107" : "#6c757d",
              color: showChatHistory ? "#000" : "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            {showChatHistory ? "💭 Chat: ON" : "💭 Chat: OFF"}
          </button>
        </div>

        {/* Basic AI Test */}
        <div style={{ marginBottom: "3rem" }}>
          <h2>Basic AI Test</h2>
          <button
            onClick={handleAICall}
            disabled={loading || !apiKey.trim()}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              backgroundColor: loading || !apiKey.trim() ? "#ccc" : "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loading || !apiKey.trim() ? "not-allowed" : "pointer",
              marginBottom: "1rem",
            }}
          >
            {loading ? "Asking Claude..." : "Get Dragon Names from AI"}
          </button>

          {response && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#f9f9f9",
                border: "1px solid #ddd",
                borderRadius: "6px",
                whiteSpace: "pre-wrap",
              }}
            >
              <h3>AI Response:</h3>
              <p>{response}</p>
            </div>
          )}
        </div>

        {/* Tool Calling Test */}
        <div style={{ marginBottom: "3rem" }}>
          <h2>Tool Calling Test</h2>
          <p>Test the dice action tools used in the game.</p>

          <button
            onClick={handleToolTest}
            disabled={toolLoading || !apiKey.trim()}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              backgroundColor:
                toolLoading || !apiKey.trim() ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: toolLoading || !apiKey.trim() ? "not-allowed" : "pointer",
              marginBottom: "1rem",
            }}
          >
            {toolLoading ? "Testing Tools..." : "Test Dice Action Tools"}
          </button>

          {toolCalls.length > 0 && (
            <div
              style={{
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "rgba(40, 167, 69, 0.1)",
                border: "2px solid #28a745",
                borderRadius: "8px",
              }}
            >
              <h3 style={{ marginTop: 0, color: "#28a745" }}>
                🔧 Tool Calls Executed
              </h3>
              {toolCalls.map((call, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "10px",
                    padding: "10px",
                    backgroundColor: "white",
                    borderRadius: "4px",
                    border: "1px solid #28a745",
                  }}
                >
                  <strong>{call.name}</strong>
                  <pre
                    style={{
                      margin: "5px 0",
                      fontSize: "12px",
                      overflow: "auto",
                    }}
                  >
                    {JSON.stringify(call.input, null, 2)}
                  </pre>
                  <div style={{ color: "#28a745", fontSize: "12px" }}>
                    ✓ Action succeeded
                  </div>
                </div>
              ))}
            </div>
          )}

          {toolResponse && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: "#f9f9f9",
                border: "1px solid #ddd",
                borderRadius: "6px",
                whiteSpace: "pre-wrap",
              }}
            >
              <h3>AI Response with Tools:</h3>
              <p>{toolResponse}</p>
            </div>
          )}
        </div>

        {/* Chat History Display */}
        {showChatHistory && chatHistory.length > 0 && (
          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "rgba(255, 193, 7, 0.1)",
              border: "2px solid #ffc107",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ marginTop: 0, color: "#856404" }}>💭 Chat History</h3>
            {chatHistory.map((message, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "15px",
                  padding: "10px",
                  backgroundColor:
                    message.role === "user" ? "#e3f2fd" : "#f3e5f5",
                  borderRadius: "8px",
                  border: `1px solid ${
                    message.role === "user" ? "#2196f3" : "#9c27b0"
                  }`,
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "5px",
                    color: message.role === "user" ? "#1976d2" : "#7b1fa2",
                  }}
                >
                  {message.role === "user" ? "👤 User" : "🤖 Assistant"}
                </div>
                <div style={{ whiteSpace: "pre-wrap", fontSize: "14px" }}>
                  {typeof message.content === "string"
                    ? message.content
                    : JSON.stringify(message.content, null, 2)}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#fee",
              border: "1px solid #f00",
              borderRadius: "6px",
              color: "#d00",
              marginBottom: "1rem",
            }}
          >
            Error: {error}
          </div>
        )}

        {/* API Key Modal */}
        <ApiKeyModal
          isOpen={showApiKeyModal}
          onClose={() => setShowApiKeyModal(false)}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
        />
      </div>
    </>
  );
}
