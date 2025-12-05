import {
    generateAltTextSuggestionTool,
    generateHeadingSuggestionTool,
    generateContentSuggestionTool,
    applySuggestionTool,
    applySuggestion
} from '@/shared/mcps/tools/suggestion-tools';

interface AIService {
    callAI: (messages: any[], model: any, tools: any[]) => Promise<any>;
}

export class SuggestionsMCPServer {
    private aiService?: AIService;

    constructor(aiService?: AIService) {
        this.aiService = aiService;
    }

    static initialize(aiService?: AIService): SuggerenceMCPServerConnection {
        return {
            name: 'suggestions',
            title: 'AI Suggestions',
            description: 'MCP server for AI-powered content suggestions and improvements',
            protocol_version: '1.0.0',
            endpoint_url: 'http://localhost:3003',
            is_active: true,
            type: 'frontend',
            connected: true,
            client: new SuggestionsMCPServer(aiService),
            id: 4,
            capabilities: 'suggestion-generation,content-improvement,accessibility-enhancement',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    }

    private tools: SuggerenceMCPResponseTool[] = [
        generateAltTextSuggestionTool,
        generateHeadingSuggestionTool,
        generateContentSuggestionTool,
        applySuggestionTool
    ];

    async getTools(): Promise<SuggerenceMCPResponseTool[]> {
        return this.tools;
    }

    async executeTool(toolName: string, args: Record<string, any>): Promise<{ content: Array<{ type: string, text: string }> }> {
        try {
            switch (toolName) {
                case 'generate_alt_text_suggestion':
                    return await this.generateAltTextWithAI(
                        args.block_id,
                        args.image_url,
                        args.context
                    );

                case 'generate_heading_suggestion':
                    return await this.generateHeadingWithAI(
                        args.block_id,
                        args.content,
                        args.level,
                        args.context
                    );

                case 'generate_content_suggestion':
                    return await this.generateContentWithAI(
                        args.block_id,
                        args.current_content,
                        args.suggestion_type,
                        args.context
                    );

                case 'apply_suggestion':
                    return await applySuggestion(
                        args.block_id,
                        args.suggestion_type,
                        args.suggested_value,
                        args.attribute_name
                    );

                default:
                    return {
                        content: [{
                            type: 'text',
                            text: `Unknown tool: ${toolName}`
                        }]
                    };
            }
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: `${toolName}_execution_failed`,
                        error: `Error executing ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`
                    })
                }]
            };
        }
    }

    private async generateAltTextWithAI(
        blockId?: string,
        imageUrl?: string,
        context?: string
    ): Promise<{ content: Array<{ type: string, text: string }> }> {
        if (!this.aiService) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        suggestedAltText: 'AI service not available',
                        confidence: 0,
                        reasoning: 'AI service not configured'
                    })
                }]
            };
        }

        try {
            const prompt = `You are a JSON-only API. Generate a concise, descriptive alt text for this image: ${imageUrl || 'an image'}

Requirements:
- Keep it under 125 characters
- Describe what's visible in the image for accessibility
- Focus on the main subject and key details
- Do not include phrases like "image of" or "picture showing"
- Just provide the alt text description directly
- Make it helpful for screen readers

${context ? `Context: ${context}` : ''}

RESPOND WITH ONLY THIS JSON OBJECT - NO OTHER TEXT:
{
  "suggestedAltText": "your alt text here",
  "confidence": 0.85,
  "reasoning": "brief explanation"
}`;

            const defaultModel = {
                id: 'suggerence-v1',
                provider: 'suggerence',
                providerName: 'Suggerence',
                name: 'Suggerence v1',
                date: new Date().toISOString(),
                capabilities: ['text-generation']
            };

            const response = await this.aiService.callAI([
                {
                    role: 'user',
                    content: prompt,
                    date: new Date().toISOString()
                }
            ], defaultModel, []);

            if (response.content) {
                try {
                    // Handle the specific format we're getting: response.content contains markdown-wrapped JSON
                    let contentToParse = response.content;
                    
                    // Remove markdown code blocks if present
                    contentToParse = contentToParse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
                    
                    // Try to parse the cleaned JSON
                    const aiResponse = JSON.parse(contentToParse.trim());
                    
                    if (aiResponse.suggestedAltText) {
                        // Ensure it's not too long
                        let suggestedValue = aiResponse.suggestedAltText;
                        if (suggestedValue.length > 125) {
                            suggestedValue = suggestedValue.substring(0, 122) + '...';
                        }

                        return {
                            content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    suggestedAltText: suggestedValue,
                                    confidence: aiResponse.confidence || 0.85,
                                    reasoning: aiResponse.reasoning || `Generated based on image URL and context: ${context || 'No additional context provided'}`
                                })
                            }]
                        };
                    }
                } catch (parseError) {
                    // If JSON parsing fails, fall back to text processing
                    console.warn('AI response was not valid JSON, falling back to text processing:', parseError);
                }

                // Fallback: process as plain text
                let suggestedValue = response.content.trim();
                
                // Clean up the response
                suggestedValue = suggestedValue
                    .replace(/^(alt text:|alt-text:|suggested alt text:|description:|here's the alt text:|alt text suggestion:)/i, '')
                    .replace(/^["']|["']$/g, '')
                    .replace(/^[-•]\s*/, '')
                    .replace(/\n.*$/s, '')
                    .trim();

                // Ensure it's not too long
                if (suggestedValue.length > 125) {
                    suggestedValue = suggestedValue.substring(0, 122) + '...';
                }

                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            suggestedAltText: suggestedValue,
                            confidence: 0.85,
                            reasoning: `Generated based on image URL and context: ${context || 'No additional context provided'}`
                        })
                    }]
                };
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        suggestedAltText: 'Unable to generate alt text',
                        confidence: 0,
                        reasoning: 'No response from AI service'
                    })
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        suggestedAltText: 'Error generating alt text',
                        confidence: 0,
                        reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    })
                }]
            };
        }
    }

    private async generateHeadingWithAI(
        blockId?: string,
        content?: string,
        level?: number,
        context?: string
    ): Promise<{ content: Array<{ type: string, text: string }> }> {
        if (!this.aiService) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'ai_service_not_available',
                        suggestedHeading: 'AI service not available',
                        seoScore: 0,
                        reasoning: 'AI service not configured'
                    })
                }]
            };
        }

        try {
            const prompt = `You are a JSON-only API. Generate a compelling heading (H${level || 2}) based on this content: "${content || 'No content provided'}"

Requirements:
- Make it engaging and SEO-friendly
- Keep it concise but descriptive
- Use proper heading structure
- Focus on the main topic

${context ? `Context: ${context}` : ''}

RESPOND WITH ONLY THIS JSON OBJECT - NO OTHER TEXT:
{
  "suggestedHeading": "your heading here",
  "seoScore": 85,
  "reasoning": "brief explanation"
}`;

            const defaultModel = {
                id: 'suggerence-v1',
                provider: 'suggerence',
                providerName: 'Suggerence',
                name: 'Suggerence v1',
                date: new Date().toISOString(),
                capabilities: ['text-generation']
            };

            const response = await this.aiService.callAI([
                {
                    role: 'user',
                    content: prompt,
                    date: new Date().toISOString()
                }
            ], defaultModel, []);

            if (response.content) {
                try {
                    // Handle the specific format we're getting: response.content contains markdown-wrapped JSON
                    let contentToParse = response.content;
                    
                    // Remove markdown code blocks if present
                    contentToParse = contentToParse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
                    
                    // Try to parse the cleaned JSON
                    const aiResponse = JSON.parse(contentToParse.trim());
                    
                    if (aiResponse.suggestedHeading) {
                        return {
                            content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    action: 'heading_suggestion_success',
                                    suggestedHeading: aiResponse.suggestedHeading,
                                    seoScore: aiResponse.seoScore || 85,
                                    reasoning: aiResponse.reasoning || `Generated heading level ${level || 2} with SEO optimization based on content analysis`
                                })
                            }]
                        };
                    }
                } catch (parseError) {
                    // If JSON parsing fails, fall back to text processing
                    console.warn('AI response was not valid JSON, falling back to text processing:', parseError);
                }

                // Fallback: process as plain text
                const suggestedHeading = response.content.trim();
                
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            action: 'heading_suggestion_success',
                            suggestedHeading,
                            seoScore: 85,
                            reasoning: `Generated heading level ${level || 2} with SEO optimization based on content analysis`
                        })
                    }]
                };
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'heading_suggestion_failed',
                        suggestedHeading: 'Unable to generate heading',
                        seoScore: 0,
                        reasoning: 'No response from AI service'
                    })
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'heading_suggestion_failed',
                        suggestedHeading: 'Error generating heading',
                        seoScore: 0,
                        reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    })
                }]
            };
        }
    }

    private async generateContentWithAI(
        blockId?: string,
        currentContent?: string,
        suggestionType?: string,
        context?: string
    ): Promise<{ content: Array<{ type: string, text: string }> }> {
        if (!this.aiService) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'ai_service_not_available',
                        suggestedContent: 'AI service not available',
                        improvementScore: 0,
                        reasoning: 'AI service not configured'
                    })
                }]
            };
        }

        try {
            const prompt = `You are a JSON-only API. Improve this content for better ${suggestionType || 'readability'}: "${currentContent || 'No content provided'}"

Requirements:
- Make it more engaging and clear
- Improve ${suggestionType || 'general'} aspects
- Keep the core message intact
- Use active voice and clear language

${context ? `Context: ${context}` : ''}

RESPOND WITH ONLY THIS JSON OBJECT - NO OTHER TEXT:
{
  "suggestedContent": "your improved content here",
  "improvementScore": 80,
  "reasoning": "brief explanation"
}`;

            const defaultModel = {
                id: 'suggerence-v1',
                provider: 'suggerence',
                providerName: 'Suggerence',
                name: 'Suggerence v1',
                date: new Date().toISOString(),
                capabilities: ['text-generation']
            };

            const response = await this.aiService.callAI([
                {
                    role: 'user',
                    content: prompt,
                    date: new Date().toISOString()
                }
            ], defaultModel, []);

            if (response.content) {
                try {
                    // Handle the specific format we're getting: response.content contains markdown-wrapped JSON
                    let contentToParse = response.content;
                    
                    // Remove markdown code blocks if present
                    contentToParse = contentToParse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
                    
                    // Try to parse the cleaned JSON
                    const aiResponse = JSON.parse(contentToParse.trim());
                    
                    if (aiResponse.suggestedContent) {
                        return {
                            content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    action: 'content_suggestion_success',
                                    suggestedContent: aiResponse.suggestedContent,
                                    improvementScore: aiResponse.improvementScore || 80,
                                    reasoning: aiResponse.reasoning || `Generated ${suggestionType || 'general'} improvement based on content analysis`
                                })
                            }]
                        };
                    }
                } catch (parseError) {
                    // If JSON parsing fails, fall back to text processing
                    console.warn('AI response was not valid JSON, falling back to text processing:', parseError);
                }

                // Fallback: process as plain text
                const suggestedContent = response.content.trim();
                
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            action: 'content_suggestion_success',
                            suggestedContent,
                            improvementScore: 80,
                            reasoning: `Generated ${suggestionType || 'general'} improvement based on content analysis`
                        })
                    }]
                };
            }

            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'content_suggestion_failed',
                        suggestedContent: 'Unable to generate content',
                        improvementScore: 0,
                        reasoning: 'No response from AI service'
                    })
                }]
            };
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'content_suggestion_failed',
                        suggestedContent: 'Error generating content',
                        improvementScore: 0,
                        reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    })
                }]
            };
        }
    }
}
