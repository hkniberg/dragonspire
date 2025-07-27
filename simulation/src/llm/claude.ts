import { Anthropic } from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";

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
    try {
      // If no schema provided, return raw text response
      if (!responseSchema) {
        return textContent;
      }

      // Parse JSON response
      const parsedResponse = JSON.parse(textContent.trim());

      log("Parsed Response", parsedResponse);

      return parsedResponse;
    } catch (error) {
      console.log("Claude response text content couldn't be parsed", JSON.stringify(textContent, null, 2))

      if (error instanceof SyntaxError && responseSchema) {
        // If direct parsing fails, try to extract just the JSON part
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

      throw error;
    }
  }
}
