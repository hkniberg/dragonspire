export interface TemplateVariables {
  [key: string]: string | number | boolean;
}

export class TemplateProcessor {
  /**
   * Load a template file from the public/prompts directory via HTTP
   */
  private async loadTemplate(templateName: string): Promise<string> {
    try {
      const response = await fetch(`/prompts/${templateName}.md`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      throw new Error(`Failed to load template "${templateName}": ${error}`);
    }
  }

  /**
   * Load the game rules from the game-rules.md file via HTTP
   */
  private async loadGameRules(): Promise<string> {
    try {
      const response = await fetch("/prompts/game-rules.md");
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      throw new Error(`Failed to load game rules: ${error}`);
    }
  }

  /**
   * Process a template by replacing all {{variableName}} with provided values
   * and inserting game rules dynamically
   */
  async processTemplate(templateName: string, variables: TemplateVariables): Promise<string> {
    const template = await this.loadTemplate(templateName);

    // If this is the system prompt and it contains {{gameRules}}, load the game rules
    let processedTemplate = template;
    if (template.includes("{{gameRules}}")) {
      const gameRules = await this.loadGameRules();
      variables = { ...variables, gameRules };
    }

    return processedTemplate.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      if (variableName in variables) {
        return String(variables[variableName]);
      }

      // Return the original match if variable is not found
      console.warn(`Template variable "${variableName}" not found in template "${templateName}"`);
      return match;
    });
  }
}

// Export a singleton instance
export const templateProcessor = new TemplateProcessor();
