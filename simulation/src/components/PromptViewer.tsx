import { MaximizableText } from "./MaximizableText";

interface PromptViewerProps {
  showPrompts: boolean;
  lastSystemPrompt: string;
  lastUserMessage: string;
}

export const PromptViewer = ({
  showPrompts,
  lastSystemPrompt,
  lastUserMessage,
}: PromptViewerProps) => {
  if (!showPrompts) {
    return null;
  }

  return (
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
      <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>
        💬 Latest AI Prompts
      </h3>

      <div style={{ marginBottom: "20px" }}>
        <MaximizableText
          title="System Prompt"
          content={lastSystemPrompt}
          maxHeight="200px"
        />
      </div>

      <div>
        <MaximizableText
          title="User Message"
          content={lastUserMessage}
          maxHeight="200px"
          backgroundColor="#f0f8ff"
          borderColor="#b8daff"
        />
      </div>
    </div>
  );
};
