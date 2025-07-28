import { TokenUsageTracker } from "@/lib/TokenUsageTracker";
import { useEffect, useState } from "react";

interface TokenUsageProps {
  tokenUsageTracker: TokenUsageTracker;
}

export function TokenUsage({ tokenUsageTracker }: TokenUsageProps) {
  // State to force re-renders every 5 seconds
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ESC key handler to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  const tokenCounts = tokenUsageTracker.getTokenCounts();
  const costs = tokenUsageTracker.getCosts();
  const totalTokens = tokenUsageTracker.getTotalTokens();

  // Format currency to 2 decimal places
  const formatCurrency = (amount: number): string => {
    return amount.toFixed(2);
  };

  // Format large numbers with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Compact widget
  const compactWidget = (
    <div
      onClick={() => setIsModalOpen(true)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor:
          totalTokens === 0
            ? "#f8f9fa"
            : costs.totalCost > 0.5
              ? "#fff5f5"
              : costs.totalCost > 0.1
                ? "#fffbf0"
                : "#f0fff4",
        border: `1px solid ${totalTokens === 0 ? "#dee2e6" : costs.totalCost > 0.5 ? "#fed7d7" : costs.totalCost > 0.1 ? "#feebc8" : "#c6f6d5"}`,
        borderRadius: "6px",
        padding: "6px 10px",
        fontSize: "13px",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
      }}
    >
      <span style={{ fontSize: "12px" }}>🧠</span>
      <span style={{ color: "#495057" }}>
        Token cost:
        <span
          style={{
            color:
              totalTokens === 0
                ? "#6c757d"
                : costs.totalCost > 0.5
                  ? "#dc3545"
                  : costs.totalCost > 0.1
                    ? "#fd7e14"
                    : "#28a745",
            fontWeight: "bold",
            marginLeft: "4px",
          }}
        >
          ${formatCurrency(costs.totalCost)}
        </span>
      </span>
    </div>
  );

  // Modal with full details
  const modal = isModalOpen && (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={() => setIsModalOpen(false)}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3
            style={{
              margin: 0,
              color: "#2c3e50",
              fontSize: "1.3rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            🧠 Claude AI Token Usage
          </h3>
          <button
            onClick={() => setIsModalOpen(false)}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#6c757d",
              padding: "0",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#f8f9fa";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            ×
          </button>
        </div>

        {totalTokens === 0 ? (
          <p style={{ margin: 0, color: "#6c757d", fontStyle: "italic", textAlign: "center", padding: "20px" }}>
            No Claude AI usage yet
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", fontSize: "14px" }}>
            {/* Token Counts */}
            <div>
              <h4 style={{ margin: "0 0 12px 0", color: "#495057", fontSize: "16px" }}>Token Counts</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span>Input:</span>
                  <span style={{ fontWeight: "bold" }}>{formatNumber(tokenCounts.inputTokens)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span>Cache Creation:</span>
                  <span style={{ fontWeight: "bold" }}>{formatNumber(tokenCounts.cacheCreationTokens)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span>Cache Read:</span>
                  <span style={{ fontWeight: "bold" }}>{formatNumber(tokenCounts.cacheReadTokens)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span>Output:</span>
                  <span style={{ fontWeight: "bold" }}>{formatNumber(tokenCounts.outputTokens)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderTop: "2px solid #dee2e6",
                    paddingTop: "8px",
                    marginTop: "8px",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>Total:</span>
                  <span style={{ fontWeight: "bold", color: "#007bff", fontSize: "16px" }}>
                    {formatNumber(totalTokens)}
                  </span>
                </div>
              </div>
            </div>

            {/* Costs */}
            <div>
              <h4 style={{ margin: "0 0 12px 0", color: "#495057", fontSize: "16px" }}>Costs (USD)</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span>Input:</span>
                  <span style={{ fontWeight: "bold" }}>${formatCurrency(costs.inputCost)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span>Cache Creation:</span>
                  <span style={{ fontWeight: "bold" }}>${formatCurrency(costs.cacheCreationCost)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span>Cache Read:</span>
                  <span style={{ fontWeight: "bold" }}>${formatCurrency(costs.cacheReadCost)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                  <span>Output:</span>
                  <span style={{ fontWeight: "bold" }}>${formatCurrency(costs.outputCost)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderTop: "2px solid #dee2e6",
                    paddingTop: "8px",
                    marginTop: "8px",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>Total:</span>
                  <span
                    style={{
                      fontWeight: "bold",
                      color: costs.totalCost > 0.5 ? "#dc3545" : costs.totalCost > 0.1 ? "#fd7e14" : "#28a745",
                      fontSize: "18px",
                    }}
                  >
                    ${formatCurrency(costs.totalCost)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <small style={{ color: "#6c757d" }}>Auto-refreshes every 5 seconds • Press ESC to close</small>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {compactWidget}
      {modal}
    </>
  );
}
