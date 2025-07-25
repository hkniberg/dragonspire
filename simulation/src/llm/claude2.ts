import { Anthropic } from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-sonnet-4-0";

// Helper function to log with timestamp
function log(label: string, content: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Claude2 ${label}:`, content);
}

export class Claude2 {
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
    async useClaude(userMessage: string, responseSchema?: any): Promise<any> {
        // Only append JSON instruction if schema is provided
        const fullUserMessage = responseSchema
            ? userMessage + `\n\nRespond with a JSON object matching the given schema: ${JSON.stringify(responseSchema, null, 2)}\n\nDo not add any other text before or after.`
            : userMessage;

        log("User Message", userMessage);
        if (responseSchema) {
            log("Response Schema", responseSchema);
        }

        const params: Anthropic.Messages.MessageCreateParamsNonStreaming = {
            model: this.model,
            // Always cache the system message
            system: [
                {
                    type: "text",
                    text: this.systemMessage,
                    cache_control: { type: "ephemeral" }
                }
            ],
            messages: [{
                role: "user",
                content: fullUserMessage
            }],
            thinking: {
                type: "enabled",
                budget_tokens: 5000
            },
            max_tokens: 16000,
        };

        try {
            const response = await this.anthropic.messages.create(params);

            // Extract text content
            const textContent = response.content
                .filter((block): block is Anthropic.TextBlock => block.type === 'text')
                .map(block => block.text)
                .join('');

            log("Raw Response", textContent);

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