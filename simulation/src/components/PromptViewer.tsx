import { useState } from "react";

interface PromptViewerProps {
  showPrompts: boolean;
  lastSystemPrompt: string;
  lastUserMessage: string;
}

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

export const PromptViewer = ({
  showPrompts,
  lastSystemPrompt,
  lastUserMessage,
}: PromptViewerProps) => {
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

  if (!showPrompts) {
    return null;
  }

  return (
    <>
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "8px",
          maxWidth: "800px",
          width: "100%",
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
          fontSize: "14px",
          lineHeight: "1.4",
          maxHeight: "400px",
          overflowY: "auto",
        }}
      >
        <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>
          💬 Latest AI Prompts
        </h3>

        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <strong
              style={{
                fontFamily: "sans-serif",
                color: "#2c3e50",
                fontSize: "16px",
              }}
            >
              System Prompt:
            </strong>
            <button
              onClick={() => openModal("System Prompt", lastSystemPrompt)}
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
              marginTop: "8px",
              padding: "12px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "6px",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {lastSystemPrompt || "No system prompt available"}
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <strong
              style={{
                fontFamily: "sans-serif",
                color: "#2c3e50",
                fontSize: "16px",
              }}
            >
              User Message:
            </strong>
            <button
              onClick={() => openModal("User Message", lastUserMessage)}
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
              marginTop: "8px",
              padding: "12px",
              backgroundColor: "#f0f8ff",
              border: "1px solid #b8daff",
              borderRadius: "6px",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            {lastUserMessage || "No user message available"}
          </div>
        </div>
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
