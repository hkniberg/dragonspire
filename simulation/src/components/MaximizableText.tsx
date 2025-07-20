import { useState } from "react";

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

interface MaximizableTextProps {
  title: string;
  content: string;
  maxHeight?: string;
  backgroundColor?: string;
  borderColor?: string;
  showTitle?: boolean;
  titleStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
}

export const MaximizableText = ({
  title,
  content,
  maxHeight = "200px",
  backgroundColor = "#f8f9fa",
  borderColor = "#dee2e6",
  showTitle = true,
  titleStyle = {},
  contentStyle = {},
}: MaximizableTextProps) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
  }>({
    isOpen: false,
    title: "",
    content: "",
  });

  const openModal = () => {
    setModalState({ isOpen: true, title, content });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, title: "", content: "" });
  };

  return (
    <>
      <div>
        {showTitle && (
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
                ...titleStyle,
              }}
            >
              {title}:
            </strong>
            <button
              onClick={openModal}
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
        )}
        <div
          style={{
            padding: "15px",
            backgroundColor,
            border: `1px solid ${borderColor}`,
            borderRadius: "6px",
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            fontSize: "14px",
            lineHeight: "1.4",
            maxHeight,
            overflowY: "auto",
            ...contentStyle,
          }}
        >
          {content || "No content available"}
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
