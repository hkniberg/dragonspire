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
      const response = await claude.simpleChat(
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

  return (
    <>
      <Head>
        <title>AI Test - Lords of Doomspire</title>
        <meta name="description" content="AI functionality test page" />
      </Head>

      <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
        <h1>AI Test Page</h1>
        <p>
          Test the AI functionality by asking Claude to suggest dragon names.
        </p>

        <div style={{ marginBottom: "1rem" }}>
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
        </div>

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
            <strong>Error:</strong> {error}
          </div>
        )}

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

        <div style={{ marginTop: "2rem", fontSize: "14px", color: "#666" }}>
          <p>
            <strong>Note:</strong> This page now uses client-side API calls.
            Your API key stays in your browser and is never sent to our servers.
          </p>
        </div>

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
