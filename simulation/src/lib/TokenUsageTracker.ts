export class TokenUsageTracker {
  // Cost constants (USD per million tokens)
  private static readonly INPUT_TOKEN_COST_PER_MILLION = 3.0;
  private static readonly CACHE_CREATION_COST_PER_MILLION = 3.75;
  private static readonly CACHE_READ_COST_PER_MILLION = 0.3;
  private static readonly OUTPUT_TOKEN_COST_PER_MILLION = 15.0;

  // Token counters
  private inputTokens = 0;
  private cacheCreationTokens = 0;
  private cacheReadTokens = 0;
  private outputTokens = 0;

  /**
   * Add token usage from a Claude API response
   */
  public addUsage(usage: {
    input_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
    output_tokens?: number;
  }): void {
    console.log("Claude usage addUsage called", usage);
    this.inputTokens += usage.input_tokens || 0;
    this.cacheCreationTokens += usage.cache_creation_input_tokens || 0;
    this.cacheReadTokens += usage.cache_read_input_tokens || 0;
    this.outputTokens += usage.output_tokens || 0;
  }

  /**
   * Get raw token counts
   */
  public getTokenCounts(): {
    inputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    outputTokens: number;
  } {
    return {
      inputTokens: this.inputTokens,
      cacheCreationTokens: this.cacheCreationTokens,
      cacheReadTokens: this.cacheReadTokens,
      outputTokens: this.outputTokens,
    };
  }

  /**
   * Calculate costs in USD for each token type
   */
  public getCosts(): {
    inputCost: number;
    cacheCreationCost: number;
    cacheReadCost: number;
    outputCost: number;
    totalCost: number;
  } {
    const inputCost = (this.inputTokens / 1_000_000) * TokenUsageTracker.INPUT_TOKEN_COST_PER_MILLION;
    const cacheCreationCost = (this.cacheCreationTokens / 1_000_000) * TokenUsageTracker.CACHE_CREATION_COST_PER_MILLION;
    const cacheReadCost = (this.cacheReadTokens / 1_000_000) * TokenUsageTracker.CACHE_READ_COST_PER_MILLION;
    const outputCost = (this.outputTokens / 1_000_000) * TokenUsageTracker.OUTPUT_TOKEN_COST_PER_MILLION;
    const totalCost = inputCost + cacheCreationCost + cacheReadCost + outputCost;

    return {
      inputCost,
      cacheCreationCost,
      cacheReadCost,
      outputCost,
      totalCost,
    };
  }

  /**
   * Reset all counters to zero
   */
  public reset(): void {
    this.inputTokens = 0;
    this.cacheCreationTokens = 0;
    this.cacheReadTokens = 0;
    this.outputTokens = 0;
  }

  /**
   * Get total token count across all types
   */
  public getTotalTokens(): number {
    return this.inputTokens + this.cacheCreationTokens + this.cacheReadTokens + this.outputTokens;
  }
} 