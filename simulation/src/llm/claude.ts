import { Anthropic } from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";
import pRetry, { AbortError } from "p-retry";

const DEFAULT_MODEL = "claude-sonnet-4-0";
const DEFAULT_RESPONSE_TOKENS = 10000;
const DEFAULT_THINKING_TOKENS = 2000;
const MAX_RETRIES = 3;
const MIN_TIMEOUT_MS = 1000; // Start with 1 second
const MAX_TIMEOUT_MS = 8000; // Cap at 8 seconds
const BACKOFF_FACTOR = 2; // Double the delay each time

// Helper function to log with timestamp
function log(label: string, content: any) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Claude ${label}:\n`, content);
}

export class Claude {
  private anthropic: Anthropic;
  private model: string;
  private systemMessage: string;

  constructor(apiKey: string, systemMessage: string, model: string = DEFAULT_MODEL) {
    this.anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    this.model = model;
    this.systemMessage = systemMessage;
  }

  /**
   * Send a user message and get either a structured JSON response (if schema provided) or plain text response
   */
  async useClaude(
    userMessage: string,
    responseSchema?: any,
    thinkingTokens: number = DEFAULT_THINKING_TOKENS,
    responseTokens: number = DEFAULT_RESPONSE_TOKENS,
    thinkingLogger?: (content: string) => void,
  ): Promise<any> {
    // Only append JSON instruction if schema is provided
    const fullUserMessage = responseSchema
      ? userMessage +
      `\n\nIMPORTANT: You must respond with a JSON object strictly obeying the given schema:\m${JSON.stringify(responseSchema, null, 2)}\n\nDo not add any other text before or after.`
      : userMessage;

    log("User Message", userMessage);

    const params: Anthropic.Messages.MessageCreateParamsNonStreaming = {
      model: this.model,
      // Always cache the system message
      system: [
        {
          type: "text",
          text: this.systemMessage,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: fullUserMessage,
        },
      ],
      ...(thinkingTokens >= 1024 && {
        thinking: {
          type: "enabled",
          budget_tokens: thinkingTokens,
        },
      }),
      max_tokens: responseTokens,
    };

    // Define the operation that will be retried
    const operation = async (attemptNumber: number) => {
      try {
        const response = await this.anthropic.messages.create(params);

        // Check for truncated thinking blocks (no text content)
        const textBlocks = response.content.filter((block): block is Anthropic.TextBlock => block.type === "text");
        const thinkingBlocks = response.content.filter((block): block is Anthropic.ThinkingBlock => block.type === "thinking");

        if (textBlocks.length === 0 && thinkingBlocks.length > 0) {
          throw new Error("Claude returned only truncated thinking blocks with no text response");
        }

        // Log each content block in sequence
        for (let i = 0; i < response.content.length; i++) {
          const block = response.content[i];
          log(
            `Content Block ${i + 1} (${block.type})`,
            block.type === "text"
              ? block.text
              : block.type === "thinking"
                ? block.thinking
                : block.type === "tool_use"
                  ? { id: block.id, name: block.name, input: block.input }
                  : block,
          );

          // Log thinking blocks using the thinkingLogger if provided
          if (block.type === "thinking" && thinkingLogger && "thinking" in block) {
            thinkingLogger(block.thinking);
          }
        }

        // Extract text content
        const textContent = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === "text")
          .map((block) => block.text)
          .join("");

        // If no schema provided, return raw text response
        if (!responseSchema) {
          return textContent;
        }

        // Try to parse JSON response
        try {
          const parsedResponse = JSON.parse(textContent.trim());
          log("Parsed Response", parsedResponse);
          return parsedResponse;
        } catch (parseError) {
          console.log("Claude response text content couldn't be parsed", JSON.stringify(textContent, null, 2));

          // Try to extract and repair JSON
          const jsonStartIndex = textContent.indexOf("{");
          const jsonEndIndex = textContent.lastIndexOf("}") + 1;

          if (jsonStartIndex === -1 || jsonEndIndex === 0 || jsonEndIndex <= jsonStartIndex) {
            throw new Error("Unable to find valid JSON markers in Claude's response");
          }

          try {
            const jsonContent = textContent.substring(jsonStartIndex, jsonEndIndex);
            const parsedResponse = JSON.parse(jsonrepair(jsonContent));
            console.warn("Warning: Had to trim Claude's response to extract valid JSON");
            log("Trimmed and Parsed Response", parsedResponse);
            return parsedResponse;
          } catch (innerError) {
            throw new Error(`Failed to parse JSON response even after trimming and repair: ${innerError instanceof Error ? innerError.message : 'Unknown error'}`);
          }
        }

      } catch (error) {
        // Check if this is a retryable error
        const isRetryable =
          error instanceof Error && (
            error.message.includes("Claude returned only truncated thinking blocks") ||
            error.message.includes("Failed to parse JSON response") ||
            error.message.includes("Unable to find valid JSON markers") ||
            error.message.includes("529") ||
            error.message.includes("overloaded")
          );

        if (!isRetryable) {
          // If not retryable, throw immediately
          throw error;
        }

        // For retryable errors, throw with attempt info for p-retry
        throw new AbortError(
          `Claude API error (attempt ${attemptNumber}): ${error instanceof Error ? error.message : String(error)}`
        );
      }
    };

    // Use p-retry to handle retries
    return pRetry(operation, {
      retries: MAX_RETRIES,
      onFailedAttempt: (error) => {
        console.warn(`Claude API error (attempt ${error.attemptNumber}/${MAX_RETRIES + 1}): ${error.message}`);
        console.log(`Retrying in ${MIN_TIMEOUT_MS * BACKOFF_FACTOR ** (error.attemptNumber - 1)}ms...`);
      },
      factor: BACKOFF_FACTOR, // Use exponential backoff
      minTimeout: MIN_TIMEOUT_MS,
      maxTimeout: MAX_TIMEOUT_MS,
    });
  }
}
