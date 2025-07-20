import { MaximizableText } from "./MaximizableText";

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
          <MaximizableText
            title="AI Strategic Analysis"
            content={aiResponse}
            maxHeight="400px"
          />
        )}
      </div>
    </>
  );
};
