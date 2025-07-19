
import { Anthropic } from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-sonnet-4-0";
//const DEFAULT_MODEL = "claude-3-5-haiku-latest"

export interface LLM {
    simpleChat(systemPrompt: string | null, userMessage: string): Promise<string>;
}

export class Claude implements LLM {
    private anthropic: Anthropic;
    private model: string;

    constructor(apiKey: string, model: string = DEFAULT_MODEL) {
        this.anthropic = new Anthropic({ apiKey });
        this.model = model;
    }

    async simpleChat(systemPrompt: string | null, userMessage: string): Promise<string> {

        const messages: Anthropic.Messages.MessageParam[] = [
            { role: "user", content: userMessage }
        ];

        const params: Anthropic.Messages.MessageCreateParamsNonStreaming = {
            model: this.model,
            messages,
            max_tokens: 16000,
            thinking: {
                type: "enabled",
                budget_tokens: 5000
            },
        };

        if (systemPrompt) {
            params.system = systemPrompt;
        }

        const response = await this.anthropic.messages.create(params);

        // Extract text content from response
        const textContent = response.content
            .filter(block => block.type === 'text')
            .map(block => block.text)
            .join('');

        return textContent;
    }
} 