import apiFetch from "@wordpress/api-fetch";

export const analyzeSEOTool: SuggerenceMCPResponseTool = {
    name: 'analyze_seo',
    description: 'Analyzes content for SEO optimization opportunities. Provides keyword suggestions, meta descriptions, title tag optimization, and content structure recommendations.',
    inputSchema: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'The content to analyze for SEO optimization.',
                required: true
            },
            target_keywords: {
                type: 'string',
                description: 'Optional: Specific keywords to target.',
                default: ''
            },
            content_type: {
                type: 'string',
                description: 'Type of content being optimized.',
                enum: ['title', 'heading', 'paragraph', 'meta_description', 'full_article'],
                default: 'paragraph'
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

export const generateMetaDescriptionTool: SuggerenceMCPResponseTool = {
    name: 'generate_meta_description',
    description: 'Generates optimized meta descriptions for SEO. Creates compelling descriptions that improve click-through rates from search results.',
    inputSchema: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'The content to create a meta description for.',
                required: true
            },
            target_keywords: {
                type: 'string',
                description: 'Keywords to include in the meta description.',
                default: ''
            },
            max_length: {
                type: 'number',
                description: 'Maximum length of the meta description.',
                default: 160
            }
        },
        required: ['content']
    }
};

export const optimizeTitleTool: SuggerenceMCPResponseTool = {
    name: 'optimize_title',
    description: 'Optimizes page titles for SEO. Creates compelling, keyword-rich titles that improve search rankings and click-through rates.',
    inputSchema: {
        type: 'object',
        properties: {
            current_title: {
                type: 'string',
                description: 'The current title to optimize.',
                required: true
            },
            target_keywords: {
                type: 'string',
                description: 'Keywords to include in the title.',
                default: ''
            },
            max_length: {
                type: 'number',
                description: 'Maximum length of the title.',
                default: 60
            }
        },
        required: ['current_title']
    }
};

export class SEOExpertMCPServer {
    static initialize(): SuggerenceMCPServerConnection {
        return {
            name: 'seo-expert',
            title: 'SEO Expert',
            description: 'Specialized SEO expert for content optimization and search engine visibility',
            protocol_version: '1.0.0',
            endpoint_url: 'http://localhost:3000',
            is_active: true,
            type: 'server',
            connected: true,
            client: new SEOExpertMCPServer(),
            id: 2,
            capabilities: 'seo-optimization,keyword-research,meta-optimization',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    }

    private tools: SuggerenceMCPResponseTool[] = [
        analyzeSEOTool,
        generateMetaDescriptionTool,
        optimizeTitleTool
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
                case 'analyze_seo':
                    return await this.analyzeSEO(args.content, args.target_keywords, args.content_type, args.context);

                case 'generate_meta_description':
                    return await this.generateMetaDescription(args.content, args.target_keywords, args.max_length);

                case 'optimize_title':
                    return await this.optimizeTitle(args.current_title, args.target_keywords, args.max_length);

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

    private async analyzeSEO(
        content: string,
        targetKeywords: string = '',
        contentType: string = 'paragraph',
        context: string = ''
    ): Promise<{ content: Array<{ type: string, text: string }> }> {
        const systemPrompt = `You are a specialized SEO expert. Analyze and optimize the provided content for search engines.

Your expertise includes:
- Keyword research and optimization
- Meta descriptions and title tags
- Content structure and readability
- Search engine ranking factors
- Local SEO and technical SEO

${targetKeywords ? `Target keywords: ${targetKeywords}` : 'Suggest relevant keywords based on the content.'}

Content type: ${contentType}

Provide a comprehensive SEO analysis including:
1. Keyword optimization suggestions
2. Meta description recommendations
3. Title tag optimization
4. Content structure improvements
5. Internal linking opportunities
6. Technical SEO considerations
7. Local SEO opportunities (if applicable)

Format your response as a detailed analysis with specific, actionable recommendations.`;

        return this.callSpecializedAI(systemPrompt, content, context);
    }

    private async generateMetaDescription(
        content: string,
        targetKeywords: string = '',
        maxLength: number = 160
    ): Promise<{ content: Array<{ type: string, text: string }> }> {
        const systemPrompt = `You are a specialized SEO expert focused on creating compelling meta descriptions.

Create a meta description that:
- Is under ${maxLength} characters
- Includes target keywords naturally
- Compels users to click
- Accurately describes the content
- Uses active voice and power words

${targetKeywords ? `Target keywords: ${targetKeywords}` : 'Include relevant keywords from the content.'}

Provide only the meta description text, no additional commentary.`;

        return this.callSpecializedAI(systemPrompt, content, '');
    }

    private async optimizeTitle(
        currentTitle: string,
        targetKeywords: string = '',
        maxLength: number = 60
    ): Promise<{ content: Array<{ type: string, text: string }> }> {
        const systemPrompt = `You are a specialized SEO expert focused on creating compelling page titles.

Create a title that:
- Is under ${maxLength} characters
- Includes target keywords naturally
- Compels users to click
- Is descriptive and clear
- Uses power words and emotional triggers

${targetKeywords ? `Target keywords: ${targetKeywords}` : 'Include relevant keywords from the content.'}

Current title: "${currentTitle}"

Provide only the optimized title text, no additional commentary.`;

        return this.callSpecializedAI(systemPrompt, currentTitle, '');
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
                            action: 'seo_analysis_complete',
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
                            action: 'seo_analysis_failed',
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
                        action: 'seo_analysis_failed',
                        error: `Error calling AI service: ${error instanceof Error ? error.message : 'Unknown error'}`
                    })
                }]
            };
        }
    }
}
