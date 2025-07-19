import Head from "next/head";
import { useState } from "react";

export default function AITest() {
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleAICall = async () => {
    setLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemPrompt: null,
          userMessage: "Suggest 3 cool names for a dragon",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI response");
      }

      setResponse(data.response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>AI Test - Lords of Dragonspire</title>
        <meta name="description" content="AI functionality test page" />
      </Head>

      <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
        <h1>AI Test Page</h1>
        <p>
          Test the AI functionality by asking Claude to suggest dragon names.
        </p>

        <button
          onClick={handleAICall}
          disabled={loading}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: loading ? "#ccc" : "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: "1rem",
          }}
        >
          {loading ? "Asking Claude..." : "Get Dragon Names from AI"}
        </button>

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
            <strong>Note:</strong> Make sure to set the ANTHROPIC_API_KEY
            environment variable.
          </p>
          <p>
            You can create a <code>.env.local</code> file in the simulation
            directory with:
          </p>
          <code>ANTHROPIC_API_KEY=your_api_key_here</code>
        </div>
      </div>
    </>
  );
}
