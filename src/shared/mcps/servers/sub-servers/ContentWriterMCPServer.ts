import apiFetch from "@wordpress/api-fetch";

export const improveContentTool: SuggerenceMCPResponseTool = {
    name: 'improve_content',
    description: 'Improves writing quality, engagement, and readability. Focuses on clarity, flow, tone, and audience engagement.',
    inputSchema: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'The content to improve.',
                required: true
            },
            tone: {
                type: 'string',
                description: 'Desired tone for the content.',
                enum: ['professional', 'casual', 'friendly', 'authoritative', 'conversational', 'persuasive'],
                default: 'professional'
            },
            audience: {
                type: 'string',
                description: 'Target audience for the content.',
                default: 'general public'
            },
            purpose: {
                type: 'string',
                description: 'Purpose of the content.',
                enum: ['inform', 'persuade', 'entertain', 'educate', 'sell'],
                default: 'inform'
            }
        },
        required: ['content']
    }
};

export const rewriteContentTool: SuggerenceMCPResponseTool = {
    name: 'rewrite_content',
    description: 'Completely rewrites content with improved structure, flow, and engagement. Maintains the core message while enhancing readability and impact.',
    inputSchema: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'The content to rewrite.',
                required: true
            },
            style: {
                type: 'string',
                description: 'Writing style for the rewrite.',
                enum: ['formal', 'casual', 'conversational', 'technical', 'creative'],
                default: 'conversational'
            },
            length: {
                type: 'string',
                description: 'Desired length of the rewritten content.',
                enum: ['shorter', 'same', 'longer'],
                default: 'same'
            }
        },
        required: ['content']
    }
};

export const addCallToActionTool: SuggerenceMCPResponseTool = {
    name: 'add_call_to_action',
    description: 'Adds compelling call-to-action statements to content. Creates persuasive CTAs that drive user engagement and conversions.',
    inputSchema: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'The content to add a CTA to.',
                required: true
            },
            cta_type: {
                type: 'string',
                description: 'Type of call-to-action to add.',
                enum: ['subscribe', 'download', 'contact', 'learn_more', 'buy_now', 'sign_up'],
                default: 'learn_more'
            },
            urgency: {
                type: 'string',
                description: 'Level of urgency for the CTA.',
                enum: ['low', 'medium', 'high'],
                default: 'medium'
            }
        },
        required: ['content']
    }
};

export class ContentWriterMCPServer {
    static initialize(): SuggerenceMCPServerConnection {
        return {
            name: 'content-writer',
            title: 'Content Writer',
            description: 'Professional content writer for improving writing quality and engagement',
            protocol_version: '1.0.0',
            endpoint_url: 'http://localhost:3000',
            is_active: true,
            type: 'server',
            connected: true,
            client: new ContentWriterMCPServer(),
            id: 3,
            capabilities: 'content-improvement,writing-quality,engagement',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    }

    private tools: SuggerenceMCPResponseTool[] = [
        improveContentTool,
        rewriteContentTool,
        addCallToActionTool
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
                case 'improve_content':
                    return await this.improveContent(args.content, args.tone, args.audience, args.purpose);

                case 'rewrite_content':
                    return await this.rewriteContent(args.content, args.style, args.length);

                case 'add_call_to_action':
                    return await this.addCallToAction(args.content, args.cta_type, args.urgency);

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

    private async improveContent(
        content: string,
        tone: string = 'professional',
        audience: string = 'general public',
        purpose: string = 'inform'
    ): Promise<{ content: Array<{ type: string, text: string }> }> {
        const systemPrompt = `You are a professional content writer specializing in creating engaging, high-quality content.

Your expertise includes:
- Writing style and tone adaptation
- Audience engagement techniques
- Content structure and flow
- Clarity and readability
- Emotional connection and persuasion

Tone: ${tone}
Audience: ${audience}
Purpose: ${purpose}

Improve the content by:
1. Enhancing flow and engagement
2. Adjusting style and tone
3. Making it audience-specific
4. Improving structure and organization
5. Enhancing readability
6. Adding emotional appeal

Provide the improved content with explanations of the changes made.`;

        return this.callSpecializedAI(systemPrompt, content, '');
    }

    private async rewriteContent(
        content: string,
        style: string = 'conversational',
        length: string = 'same'
    ): Promise<{ content: Array<{ type: string, text: string }> }> {
        const systemPrompt = `You are a professional content writer specializing in rewriting content for better impact.

Style: ${style}
Length: ${length}

Rewrite the content to:
1. Improve structure and flow
2. Enhance readability and engagement
3. Maintain the core message
4. Use the specified style
5. Adjust length as requested

Provide only the rewritten content, no additional commentary.`;

        return this.callSpecializedAI(systemPrompt, content, '');
    }

    private async addCallToAction(
        content: string,
        ctaType: string = 'learn_more',
        urgency: string = 'medium'
    ): Promise<{ content: Array<{ type: string, text: string }> }> {
        const systemPrompt = `You are a professional content writer specializing in creating compelling call-to-action statements.

CTA Type: ${ctaType}
Urgency Level: ${urgency}

Add a compelling call-to-action that:
1. Matches the content context
2. Uses the specified CTA type
3. Creates appropriate urgency
4. Compels user action
5. Flows naturally with the content

Provide the content with the added CTA integrated naturally.`;

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
                            content: `Content to improve: "${content}"\n\nContext: ${context || 'No additional context provided'}`
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
                            action: 'content_improvement_complete',
                            data: {
                                original_content: content,
                                improved_content: response.content,
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
                            action: 'content_improvement_failed',
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
                        action: 'content_improvement_failed',
                        error: `Error calling AI service: ${error instanceof Error ? error.message : 'Unknown error'}`
                    })
                }]
            };
        }
    }
}
