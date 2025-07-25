import { Anthropic } from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-sonnet-4-0";
const DEFAULT_RESPONSE_TOKENS = 10000;
const DEFAULT_THINKING_TOKENS = 2000;

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
  ): Promise<any> {
    // Only append JSON instruction if schema is provided
    const fullUserMessage = responseSchema
      ? userMessage +
        `\n\nRespond with a JSON object matching the given schema: ${JSON.stringify(responseSchema, null, 2)}\n\nDo not add any other text before or after.`
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
      thinking: {
        type: "enabled",
        budget_tokens: thinkingTokens,
      },
      max_tokens: responseTokens,
    };

    try {
      const response = await this.anthropic.messages.create(params);

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

      // Parse JSON response
      const parsedResponse = JSON.parse(textContent.trim());

      log("Parsed Response", parsedResponse);

      return parsedResponse;
    } catch (error) {
      if (error instanceof SyntaxError && responseSchema) {
        throw new Error(`Failed to parse JSON response: ${error.message}`);
      }
      throw error;
    }
  }
}
