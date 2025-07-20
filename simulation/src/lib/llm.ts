
import { Anthropic } from "@anthropic-ai/sdk";
import { diceActionTools } from "./tools";

const DEFAULT_MODEL = "claude-sonnet-4-0";
//const DEFAULT_MODEL = "claude-3-5-haiku-latest"
const PROMPT_CACHING_ENABLED = true; // Enable prompt caching for system prompts and user messages

// Logging configuration
const MAX_LOG_MESSAGE_LENGTH = 1000;

export interface LLM {
    useLLM(systemPrompt: string | null, userMessage: string): Promise<string>;
}

// Helper function to truncate long messages for logging
function truncateForLog(message: string, maxLength: number = MAX_LOG_MESSAGE_LENGTH): string {
    if (message.length <= maxLength) {
        return message;
    }
    return message.substring(0, maxLength) + "...[truncated]";
}

// Helper function to log with timestamp
function log(label: string, content: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${label}:\n`, content);
}

// Helper function to log thinking blocks from response content
function logThinkingBlocks(content: any[]) {
    for (const block of content) {
        if (block.type === 'thinking') {
            log("LLM Thinking", block.thinking);
        }
    }
}

export class Claude implements LLM {
    private anthropic: Anthropic;
    private model: string;

    constructor(apiKey: string, model: string = DEFAULT_MODEL) {
        this.anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
        this.model = model;
    }

    async useLLM(systemPrompt: string | null, userMessage: string): Promise<string> {
        // Log input
        log("LLM System Prompt", systemPrompt ? truncateForLog(systemPrompt) : "None");
        log("LLM User Message", truncateForLog(userMessage));

        // Create user message with cache control if enabled
        const userMessageParam: Anthropic.Messages.MessageParam = {
            role: "user",
            content: PROMPT_CACHING_ENABLED ? [
                {
                    type: "text",
                    text: userMessage,
                    cache_control: { type: "ephemeral" }
                }
            ] : userMessage
        };

        const messages: Anthropic.Messages.MessageParam[] = [userMessageParam];

        const params: Anthropic.Messages.MessageCreateParamsNonStreaming = {
            model: this.model,
            messages,
            max_tokens: 16000,
            thinking: {
                type: "enabled",
                budget_tokens: 5000
            },
        };

        // Add system prompt with cache control if provided
        if (systemPrompt) {
            if (PROMPT_CACHING_ENABLED) {
                params.system = [
                    {
                        type: "text",
                        text: systemPrompt,
                        cache_control: { type: "ephemeral" }
                    }
                ];
            } else {
                params.system = systemPrompt;
            }
        }

        log("LLM Model", this.model);

        const response = await this.anthropic.messages.create(params);

        // Log thinking blocks
        logThinkingBlocks(response.content);

        // Extract text content from response
        const textContent = response.content
            .filter(block => block.type === 'text')
            .map(block => block.text)
            .join('');

        // Log response
        log("LLM Response", textContent);

        return textContent;
    }

    async useLLMWithTools(systemPrompt: string | null, userMessage: string): Promise<{
        messages: Anthropic.Messages.MessageParam[],
        response: string,
        toolCalls: Anthropic.ToolUseBlock[]
    }> {
        // Log input
        log("LLM System Prompt", systemPrompt ? truncateForLog(systemPrompt) : "None");
        log("LLM User Message", truncateForLog(userMessage));

        // Create user message with cache control if enabled
        const userMessageParam: Anthropic.Messages.MessageParam = {
            role: "user",
            content: PROMPT_CACHING_ENABLED ? [
                {
                    type: "text",
                    text: userMessage,
                    cache_control: { type: "ephemeral" }
                }
            ] : userMessage
        };

        const messages: Anthropic.Messages.MessageParam[] = [userMessageParam];

        const allToolCalls: Anthropic.ToolUseBlock[] = [];
        let finalResponse = '';
        let toolCallsRemaining = true;
        let callLoopCount = 0;
        const CALL_LOOP_LIMIT = 10;

        log("LLM Model", this.model);
        log("LLM Available Tools", diceActionTools.map(tool => tool.name));

        while (toolCallsRemaining) {
            callLoopCount++;
            if (callLoopCount > CALL_LOOP_LIMIT) {
                throw new Error(`Tool call loop limit exceeded: ${CALL_LOOP_LIMIT}`);
            }

            const params: Anthropic.Messages.MessageCreateParamsNonStreaming = {
                model: this.model,
                messages,
                max_tokens: 16000,
                tools: diceActionTools,
                thinking: {
                    type: "enabled",
                    budget_tokens: 5000
                },
            };

            // Add system prompt with cache control if provided
            if (systemPrompt) {
                if (PROMPT_CACHING_ENABLED) {
                    params.system = [
                        {
                            type: "text",
                            text: systemPrompt,
                            cache_control: { type: "ephemeral" }
                        }
                    ];
                } else {
                    params.system = systemPrompt;
                }
            }

            // Add cache control to the last tool definition if prompt caching is enabled
            if (PROMPT_CACHING_ENABLED && params.tools && params.tools.length > 0) {
                (params.tools[params.tools.length - 1] as any).cache_control = { type: "ephemeral" };
            }

            const response = await this.anthropic.messages.create(params);

            // Log each content block in sequence
            for (let i = 0; i < response.content.length; i++) {
                const block = response.content[i];
                log(`Content Block ${i + 1} (${block.type})`,
                    block.type === 'text' ? block.text :
                        block.type === 'thinking' ? block.thinking :
                            block.type === 'tool_use' ? { id: block.id, name: block.name, input: block.input } :
                                block
                );
            }

            // Check if there are tool calls
            const toolUseBlocks = response.content.filter(
                (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
            );

            if (toolUseBlocks.length > 0) {
                // Add assistant message with tool calls
                messages.push({
                    role: "assistant",
                    content: response.content
                });

                // Track all tool calls
                allToolCalls.push(...toolUseBlocks);

                // Execute tools and add results
                const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map(toolCall => {
                    // For now, just return success - in a real implementation you'd execute the tool
                    const result = "Action succeeded";
                    log("Tool Result", { id: toolCall.id, result });

                    return {
                        type: "tool_result",
                        tool_use_id: toolCall.id,
                        content: result
                    };
                });

                // Add tool results as user message
                messages.push({
                    role: "user",
                    content: toolResults
                });
            } else {
                // No tool calls, extract final response
                toolCallsRemaining = false;

                finalResponse = response.content
                    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
                    .map(block => block.text)
                    .join('');

                // Add final response to messages
                messages.push({
                    role: "assistant",
                    content: response.content
                });
            }
        }

        log("LLM Complete", {
            toolCallCount: allToolCalls.length,
            responseLength: finalResponse.length,
            totalMessages: messages.length,
            loopCount: callLoopCount
        });

        return {
            messages,
            response: finalResponse,
            toolCalls: allToolCalls
        };
    }
} 