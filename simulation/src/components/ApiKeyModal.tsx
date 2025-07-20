import { useEffect, useState } from "react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onApiKeyChange,
}) => {
  const [localKey, setLocalKey] = useState<string>(apiKey);
  const [showKey, setShowKey] = useState<boolean>(false);
  const [rememberKey, setRememberKey] = useState<boolean>(false);
  const [isKeyFromStorage, setIsKeyFromStorage] = useState<boolean>(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem("anthropic-api-key");
    if (storedKey) {
      setLocalKey(storedKey);
      onApiKeyChange(storedKey);
      setIsKeyFromStorage(true);
      setRememberKey(true);
    }
  }, [onApiKeyChange]);

  // Sync localKey with parent apiKey when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalKey(apiKey);
    }
  }, [isOpen, apiKey]);

  const handleSave = () => {
    onApiKeyChange(localKey);

    if (rememberKey && localKey.trim()) {
      localStorage.setItem("anthropic-api-key", localKey);
    } else {
      localStorage.removeItem("anthropic-api-key");
    }

    setIsKeyFromStorage(rememberKey && localKey.trim() !== "");
    onClose();
  };

  const handleClearStoredKey = () => {
    localStorage.removeItem("anthropic-api-key");
    setIsKeyFromStorage(false);
    setRememberKey(false);
    setLocalKey("");
    onApiKeyChange("");
  };

  const handleCancel = () => {
    setLocalKey(apiKey); // Reset to original value
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={onClose}
      >
        {/* Modal Content */}
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
            width: "500px",
            maxWidth: "90vw",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ margin: "0 0 16px 0", color: "#2c3e50" }}>
            🔑 Anthropic API Key
          </h3>

          {isKeyFromStorage && (
            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "#d4edda",
                border: "1px solid #c3e6cb",
                borderRadius: "4px",
                marginBottom: "16px",
                fontSize: "14px",
                color: "#155724",
              }}
            >
              ✅ Using saved API key from browser storage
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: "bold",
                color: "#2c3e50",
              }}
            >
              API Key:
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type={showKey ? "text" : "password"}
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                placeholder="sk-ant-..."
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  fontSize: "14px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                style={{
                  padding: "10px 12px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {showKey ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={rememberKey}
                onChange={(e) => setRememberKey(e.target.checked)}
              />
              Remember this key in browser storage
            </label>
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#666",
              marginBottom: "20px",
              padding: "8px",
              backgroundColor: "#f8f9fa",
              borderRadius: "4px",
            }}
          >
            🔒 Your API key is stored locally in your browser and never sent to
            our servers.
            <br />
            Get your key from{" "}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0070f3" }}
            >
              console.anthropic.com
            </a>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
            }}
          >
            {isKeyFromStorage && (
              <button
                onClick={handleClearStoredKey}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  marginRight: "auto",
                }}
              >
                Clear Stored Key
              </button>
            )}

            <button
              onClick={handleCancel}
              style={{
                padding: "8px 16px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              style={{
                padding: "8px 16px",
                backgroundColor: "#0070f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
