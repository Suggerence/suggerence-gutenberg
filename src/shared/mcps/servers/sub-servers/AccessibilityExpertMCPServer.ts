import apiFetch from "@wordpress/api-fetch";

export const analyzeAccessibilityTool: SuggerenceMCPResponseTool = {
    name: 'analyze_accessibility',
    description: 'Analyzes content for accessibility issues and provides WCAG compliance recommendations. Identifies barriers and suggests improvements for inclusive design.',
    inputSchema: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'The content to analyze for accessibility.',
                required: true
            },
            content_type: {
                type: 'string',
                description: 'Type of content being analyzed.',
                enum: ['text', 'image', 'heading', 'link', 'form', 'full_page'],
                default: 'text'
            },
            context: {
                type: 'string',
                description: 'Additional context about the content.',
                default: ''
            }
        },
        required: ['content']
    }
};

export const generateAltTextTool: SuggerenceMCPResponseTool = {
    name: 'generate_alt_text',
    description: 'Generates descriptive alternative text for images. Creates concise, meaningful alt text that describes the image content for screen readers.',
    inputSchema: {
        type: 'object',
        properties: {
            image_description: {
                type: 'string',
                description: 'Description of what the image shows.',
                required: true
            },
            context: {
                type: 'string',
                description: 'Context about where the image appears.',
                default: ''
            },
            max_length: {
                type: 'number',
                description: 'Maximum length of the alt text.',
                default: 125
            }
        },
        required: ['image_description']
    }
};

export const improveHeadingStructureTool: SuggerenceMCPResponseTool = {
    name: 'improve_heading_structure',
    description: 'Analyzes and improves heading structure for better accessibility. Ensures proper heading hierarchy and semantic structure.',
    inputSchema: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'The content with headings to analyze.',
                required: true
            },
            current_structure: {
                type: 'string',
                description: 'Current heading structure (optional).',
                default: ''
            }
        },
        required: ['content']
    }
};

export class AccessibilityExpertMCPServer {
    static initialize(): SuggerenceMCPServerConnection {
        return {
            name: 'accessibility-expert',
            title: 'Accessibility Expert',
            description: 'Specialized accessibility expert for inclusive content and WCAG compliance',
            protocol_version: '1.0.0',
            endpoint_url: 'http://localhost:3000',
            is_active: true,
            type: 'server',
            connected: true,
            client: new AccessibilityExpertMCPServer(),
            id: 4,
            capabilities: 'accessibility,wcag-compliance,inclusive-design',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    }

    private tools: SuggerenceMCPResponseTool[] = [
        analyzeAccessibilityTool,
        generateAltTextTool,
        improveHeadingStructureTool
    ];

    listTools(): { tools: SuggerenceMCPResponseTool[] } {
        return {
            tools: this.tools
        };
    }

    async callTool(params: { name: string, arguments: Record<string, any> }): Promise<{ content: Array<{ type: string, text: string }> }> {
        const { name, arguments: args } = params;

        try {
            switch (name) {
                case 'analyze_accessibility':
                    return await this.analyzeAccessibility(args.content, args.content_type, args.context);

                case 'generate_alt_text':
                    return await this.generateAltText(args.image_description, args.context, args.max_length);

                case 'improve_heading_structure':
                    return await this.improveHeadingStructure(args.content, args.current_structure);

                default:
                    throw new Error(`Unknown tool: ${name}`);
            }
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: `${name}_execution_failed`,
                        error: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
                    })
                }]
            };
        }
    }

    private async analyzeAccessibility(
        content: string,
        contentType: string = 'text',
        context: string = ''
    ): Promise<{ content: Array<{ type: string, text: string }> }> {
        const systemPrompt = `You are a specialized accessibility expert focused on making content inclusive for all users.

Your expertise includes:
- WCAG 2.1 AA compliance
- Screen reader optimization
- Keyboard navigation
- Color contrast and visual accessibility
- Alternative text for images
- Heading structure and semantic HTML
- Focus management and ARIA labels

Content type: ${contentType}

Analyze the content and provide:
1. Current accessibility issues identified
2. Specific improvements needed
3. Alternative text suggestions (if applicable)
4. Heading structure recommendations
5. Color contrast considerations
6. Keyboard navigation improvements
7. Screen reader optimization
8. ARIA label suggestions
9. Semantic HTML recommendations
10. Focus management improvements

Format your response with specific, actionable accessibility improvements.`;

        return this.callSpecializedAI(systemPrompt, content, context);
    }

    private async generateAltText(
        imageDescription: string,
        context: string = '',
        maxLength: number = 125
    ): Promise<{ content: Array<{ type: string, text: string }> }> {
        const systemPrompt = `You are a specialized accessibility expert focused on creating descriptive alternative text for images.

Create alt text that:
- Is under ${maxLength} characters
- Describes the image content accurately
- Is meaningful for screen readers
- Avoids phrases like "image of" or "picture showing"
- Focuses on the main subject and key details

${context ? `Context: ${context}` : ''}

Provide only the alt text, no additional commentary.`;

        return this.callSpecializedAI(systemPrompt, imageDescription, '');
    }

    private async improveHeadingStructure(
        content: string,
        currentStructure: string = ''
    ): Promise<{ content: Array<{ type: string, text: string }> }> {
        const systemPrompt = `You are a specialized accessibility expert focused on heading structure and semantic HTML.

${currentStructure ? `Current structure: ${currentStructure}` : ''}

Analyze and improve the heading structure by:
1. Ensuring proper heading hierarchy (H1 → H2 → H3, etc.)
2. Using semantic HTML elements
3. Making headings descriptive and meaningful
4. Avoiding skipped heading levels
5. Ensuring logical document outline

Provide the improved content with proper heading structure.`;

        return this.callSpecializedAI(systemPrompt, content, '');
    }

    private async callSpecializedAI(
        prompt: string,
        content: string,
        context: string = ''
    ): Promise<{ content: Array<{ type: string, text: string }> }> {
        try {
            const response = await apiFetch({
                path: '/suggerence-gutenberg/ai-providers/v1/providers/text',
                method: 'POST',
                data: {
                    model: 'suggerence-v1',
                    provider: 'suggerence',
                    system: prompt,
                    messages: [
                        {
                            role: 'user',
                            content: `Content to analyze: "${content}"\n\nContext: ${context || 'No additional context provided'}`
                        }
                    ]
                }
            }) as any;

            if (response.content) {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            action: 'accessibility_analysis_complete',
                            data: {
                                original_content: content,
                                analysis: response.content,
                                timestamp: new Date().toISOString()
                            }
                        }, null, 2)
                    }]
                };
            } else {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            action: 'accessibility_analysis_failed',
                            error: 'No response from AI service'
                        })
                    }]
                };
            }
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'accessibility_analysis_failed',
                        error: `Error calling AI service: ${error instanceof Error ? error.message : 'Unknown error'}`
                    })
                }]
            };
        }
    }
}
