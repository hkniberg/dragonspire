import { useState } from "react";

// Spinner component
const Spinner = ({ size = 20 }: { size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      border: `2px solid #f3f3f3`,
      borderTop: `2px solid #3498db`,
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      display: "inline-block",
      marginRight: "8px",
    }}
  />
);

// Add keyframes for spinner animation
const spinnerStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Modal component for maximized view
const Modal = ({
  isOpen,
  onClose,
  title,
  content,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          width: "90%",
          height: "90%",
          maxWidth: "1200px",
          maxHeight: "800px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "15px 20px",
            borderBottom: "1px solid #dee2e6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <h3 style={{ margin: 0, color: "#2c3e50" }}>{title}</h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={handleCopy}
              style={{
                padding: "6px 12px",
                backgroundColor: copySuccess ? "#28a745" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              {copySuccess ? "✓ Copied!" : "📋 Copy"}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "6px 12px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: "20px",
            overflow: "auto",
            fontFamily: "monospace",
            fontSize: "14px",
            lineHeight: "1.4",
            whiteSpace: "pre-wrap",
            backgroundColor: "#f8f9fa",
          }}
        >
          {content || "No content available"}
        </div>
      </div>
    </div>
  );
};

interface AIMoveResultProps {
  loading: boolean;
  lastDiceRolls: number[];
  aiResponse: string;
  error: string;
}

export const AIMoveResult = ({
  loading,
  lastDiceRolls,
  aiResponse,
  error,
}: AIMoveResultProps) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
  }>({
    isOpen: false,
    title: "",
    content: "",
  });

  const openModal = (title: string, content: string) => {
    setModalState({ isOpen: true, title, content });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, title: "", content: "" });
  };

  // Only render if there's something to show
  if (!loading && lastDiceRolls.length === 0 && !aiResponse && !error) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: spinnerStyles }} />
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "8px",
          maxWidth: "800px",
          width: "100%",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>
          🎯 AI Move Analysis
        </h3>

        {loading && (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#2c3e50",
              fontSize: "16px",
            }}
          >
            <Spinner size={24} />
            <strong>Claude Sonnet 4.0 is analyzing the board state...</strong>
            <div style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
              Rolling dice and evaluating strategic options
            </div>
          </div>
        )}

        {!loading && lastDiceRolls.length > 0 && (
          <div style={{ marginBottom: "10px" }}>
            <strong>Dice Rolled:</strong> {lastDiceRolls.join(", ")} (D3 dice
            showing values 1-3)
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "10px",
              backgroundColor: "#fee",
              border: "1px solid #f00",
              borderRadius: "4px",
              color: "#d00",
              marginBottom: "10px",
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && aiResponse && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <strong style={{ fontFamily: "sans-serif", color: "#2c3e50" }}>
                AI Strategic Analysis:
              </strong>
              <button
                onClick={() => openModal("AI Strategic Analysis", aiResponse)}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                🔍 Maximize
              </button>
            </div>
            <div
              style={{
                padding: "15px",
                backgroundColor: "#f8f9fa",
                border: "1px solid #dee2e6",
                borderRadius: "6px",
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                fontSize: "14px",
                lineHeight: "1.4",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {aiResponse}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        content={modalState.content}
      />
    </>
  );
};
