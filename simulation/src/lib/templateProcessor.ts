export interface TemplateVariables {
    [key: string]: string | number | boolean;
}

export class TemplateProcessor {
    private isNodeEnvironment(): boolean {
        return typeof window === 'undefined' && typeof process !== 'undefined';
    }

    private getTemplatePath(templateName: string): string {
        if (this.isNodeEnvironment()) {
            // Import path only when needed in Node.js
            const path = require('path');
            return path.join(__dirname, '../../public/prompts', `${templateName}.md`);
        } else {
            // In browser, use the web path
            return `/prompts/${templateName}.md`;
        }
    }

    /**
     * Load a template file from the public/prompts directory
     */
    private async loadTemplate(templateName: string): Promise<string> {
        try {
            if (this.isNodeEnvironment()) {
                // Node.js environment - use file system
                const fs = require('fs');
                const templatePath = this.getTemplatePath(templateName);
                if (!fs.existsSync(templatePath)) {
                    throw new Error(`Template file not found: ${templatePath}`);
                }
                return fs.readFileSync(templatePath, 'utf-8');
            } else {
                // Browser environment - use fetch
                const response = await fetch(`/prompts/${templateName}.md`);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return await response.text();
            }
        } catch (error) {
            throw new Error(`Failed to load template "${templateName}": ${error}`);
        }
    }

    /**
     * Load the game rules from the game-rules.md file
     */
    private async loadGameRules(): Promise<string> {
        try {
            if (this.isNodeEnvironment()) {
                // Node.js environment - use file system
                const fs = require('fs');
                const path = require('path');
                const rulesPath = path.join(__dirname, '../../public/prompts/game-rules.md');
                if (!fs.existsSync(rulesPath)) {
                    throw new Error(`Game rules file not found: ${rulesPath}`);
                }
                return fs.readFileSync(rulesPath, 'utf-8');
            } else {
                // Browser environment - use fetch
                const response = await fetch('/prompts/game-rules.md');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return await response.text();
            }
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
        if (template.includes('{{gameRules}}')) {
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