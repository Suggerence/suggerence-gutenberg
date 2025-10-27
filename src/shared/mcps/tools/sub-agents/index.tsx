import apiFetch from "@wordpress/api-fetch";

// SEO Expert Sub-Agent
export const seoExpertTool: SuggerenceMCPResponseTool = {
    name: 'seo_expert',
    description: 'Specialized SEO expert that analyzes and optimizes content for search engines. Provides keyword suggestions, meta descriptions, title tag optimization, and content structure recommendations. Use this when the user wants to improve their content\'s search engine visibility and ranking potential.',
    inputSchema: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'The content to analyze and optimize for SEO. Can be a paragraph, heading, or full article. REQUIRED PARAMETER - this is what the AI will analyze.',
                required: true
            },
            target_keywords: {
                type: 'string',
                description: 'Optional: Specific keywords or phrases you want to target. If not provided, the expert will suggest relevant keywords.',
                default: ''
            },
            content_type: {
                type: 'string',
                description: 'The type of content being optimized: "title", "heading", "paragraph", "meta_description", "full_article".',
                enum: ['title', 'heading', 'paragraph', 'meta_description', 'full_article'],
                default: 'paragraph'
            },
            context: {
                type: 'string',
                description: 'Additional context about the content, target audience, or business goals.',
                default: ''
            }
        },
        required: ['content']
    }
};

// Content Writer Sub-Agent
export const contentWriterTool: SuggerenceMCPResponseTool = {
    name: 'content_writer',
    description: 'Professional content writer that improves writing quality, engagement, and readability. Focuses on clarity, flow, tone, and audience engagement. Use this when you want to enhance the writing quality and make content more compelling.',
    inputSchema: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'The content to improve and rewrite. REQUIRED PARAMETER - this is what the AI will improve.',
                required: true
            },
            tone: {
                type: 'string',
                description: 'Desired tone for the content: "professional", "casual", "friendly", "authoritative", "conversational", "persuasive".',
                enum: ['professional', 'casual', 'friendly', 'authoritative', 'conversational', 'persuasive'],
                default: 'professional'
            },
            audience: {
                type: 'string',
                description: 'Target audience for the content (e.g., "business professionals", "general public", "technical experts").',
                default: 'general public'
            },
            purpose: {
                type: 'string',
                description: 'Purpose of the content: "inform", "persuade", "entertain", "educate", "sell".',
                enum: ['inform', 'persuade', 'entertain', 'educate', 'sell'],
                default: 'inform'
            },
            context: {
                type: 'string',
                description: 'Additional context about the content or specific requirements.',
                default: ''
            }
        },
        required: ['content']
    }
};

// Accessibility Expert Sub-Agent
export const accessibilityExpertTool: SuggerenceMCPResponseTool = {
    name: 'accessibility_expert',
    description: 'Accessibility expert that ensures content is inclusive and accessible to all users, including those with disabilities. Provides alt text suggestions, heading structure analysis, and accessibility best practices. Use this to make content more accessible and compliant with WCAG guidelines.',
    inputSchema: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'The content to analyze for accessibility improvements. REQUIRED PARAMETER - this is what the AI will analyze.',
                required: true
            },
            content_type: {
                type: 'string',
                description: 'Type of content: "text", "image", "heading", "link", "form", "full_page".',
                enum: ['text', 'image', 'heading', 'link', 'form', 'full_page'],
                default: 'text'
            },
            image_description: {
                type: 'string',
                description: 'If content_type is "image", provide a description of what the image shows.',
                default: ''
            },
            context: {
                type: 'string',
                description: 'Additional context about the content or specific accessibility concerns.',
                default: ''
            }
        },
        required: ['content']
    }
};

// Copy Editor Sub-Agent
export const copyEditorTool: SuggerenceMCPResponseTool = {
    name: 'copy_editor',
    description: 'Professional copy editor that focuses on grammar, spelling, punctuation, style, and clarity. Ensures content is error-free and follows proper writing conventions. Use this for final proofreading and editing before publishing.',
    inputSchema: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'The content to edit and proofread. REQUIRED PARAMETER - this is what the AI will edit.',
                required: true
            },
            style_guide: {
                type: 'string',
                description: 'Style guide to follow: "AP", "Chicago", "MLA", "APA", "custom".',
                enum: ['AP', 'Chicago', 'MLA', 'APA', 'custom'],
                default: 'AP'
            },
            focus_areas: {
                type: 'array',
                description: 'Specific areas to focus on: ["grammar", "spelling", "punctuation", "style", "clarity", "consistency"].',
                items: {
                    type: 'string',
                    enum: ['grammar', 'spelling', 'punctuation', 'style', 'clarity', 'consistency']
                },
                default: ['grammar', 'spelling', 'punctuation']
            },
            context: {
                type: 'string',
                description: 'Additional context about the content or specific editing requirements.',
                default: ''
            }
        },
        required: ['content']
    }
};

// Social Media Expert Sub-Agent
export const socialMediaExpertTool: SuggerenceMCPResponseTool = {
    name: 'social_media_expert',
    description: 'Social media expert that creates engaging content optimized for different social platforms. Adapts content for Twitter, Facebook, LinkedIn, Instagram, etc. Use this when you want to create social media posts or adapt content for social sharing.',
    inputSchema: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'The original content to adapt for social media. REQUIRED PARAMETER - this is what the AI will adapt.',
                required: true
            },
            platform: {
                type: 'string',
                description: 'Target social media platform: "twitter", "facebook", "linkedin", "instagram", "tiktok", "youtube".',
                enum: ['twitter', 'facebook', 'linkedin', 'instagram', 'tiktok', 'youtube'],
                default: 'twitter'
            },
            post_type: {
                type: 'string',
                description: 'Type of social media post: "text", "image_caption", "video_description", "story", "poll".',
                enum: ['text', 'image_caption', 'video_description', 'story', 'poll'],
                default: 'text'
            },
            tone: {
                type: 'string',
                description: 'Desired tone: "professional", "casual", "funny", "inspirational", "urgent".',
                enum: ['professional', 'casual', 'funny', 'inspirational', 'urgent'],
                default: 'casual'
            },
            include_hashtags: {
                type: 'boolean',
                description: 'Whether to include relevant hashtags.',
                default: true
            },
            context: {
                type: 'string',
                description: 'Additional context about the content or campaign goals.',
                default: ''
            }
        },
        required: ['content']
    }
};

// Technical Writer Sub-Agent
export const technicalWriterTool: SuggerenceMCPResponseTool = {
    name: 'technical_writer',
    description: 'Technical writing expert that specializes in creating clear, accurate, and comprehensive technical documentation. Focuses on clarity, accuracy, and user-friendly explanations of complex topics. Use this for documentation, tutorials, and technical content.',
    inputSchema: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'The technical content to improve or document. REQUIRED PARAMETER - this is what the AI will improve.',
                required: true
            },
            audience_level: {
                type: 'string',
                description: 'Technical level of the target audience: "beginner", "intermediate", "advanced", "expert".',
                enum: ['beginner', 'intermediate', 'advanced', 'expert'],
                default: 'intermediate'
            },
            content_type: {
                type: 'string',
                description: 'Type of technical content: "tutorial", "documentation", "api_reference", "troubleshooting", "concept_explanation".',
                enum: ['tutorial', 'documentation', 'api_reference', 'troubleshooting', 'concept_explanation'],
                default: 'documentation'
            },
            include_examples: {
                type: 'boolean',
                description: 'Whether to include practical examples and code snippets.',
                default: true
            },
            context: {
                type: 'string',
                description: 'Additional context about the technical topic or specific requirements.',
                default: ''
            }
        },
        required: ['content']
    }
};

// Marketing Expert Sub-Agent
export const marketingExpertTool: SuggerenceMCPResponseTool = {
    name: 'marketing_expert',
    description: 'Marketing expert that creates compelling, persuasive content designed to drive engagement and conversions. Focuses on emotional appeal, call-to-actions, and marketing psychology. Use this for promotional content, sales copy, and marketing campaigns.',
    inputSchema: {
        type: 'object',
        properties: {
            content: {
                type: 'string',
                description: 'The content to optimize for marketing effectiveness. REQUIRED PARAMETER - this is what the AI will optimize.',
                required: true
            },
            campaign_goal: {
                type: 'string',
                description: 'Primary goal of the marketing content: "awareness", "engagement", "conversion", "retention", "brand_building".',
                enum: ['awareness', 'engagement', 'conversion', 'retention', 'brand_building'],
                default: 'engagement'
            },
            target_audience: {
                type: 'string',
                description: 'Primary target audience for the marketing content.',
                default: 'general consumers'
            },
            include_cta: {
                type: 'boolean',
                description: 'Whether to include a call-to-action.',
                default: true
            },
            urgency_level: {
                type: 'string',
                description: 'Level of urgency to convey: "low", "medium", "high", "critical".',
                enum: ['low', 'medium', 'high', 'critical'],
                default: 'medium'
            },
            context: {
                type: 'string',
                description: 'Additional context about the marketing campaign or product.',
                default: ''
            }
        },
        required: ['content']
    }
};

// Generic function to call AI with specialized prompts
async function callSpecializedAI(
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
                        action: 'specialized_analysis_complete',
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
                        action: 'specialized_analysis_failed',
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
                    action: 'specialized_analysis_failed',
                    error: `Error calling AI service: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

// SEO Expert implementation
export async function seoExpert(
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

    return callSpecializedAI(systemPrompt, content, context);
}

// Content Writer implementation
export async function contentWriter(
    content: string,
    tone: string = 'professional',
    audience: string = 'general public',
    purpose: string = 'inform',
    context: string = ''
): Promise<{ content: Array<{ type: string, text: string }> }> {
    const prompt = `You are a professional content writer specializing in creating engaging, high-quality content.

Your expertise includes:
- Writing style and tone adaptation
- Audience engagement techniques
- Content structure and flow
- Clarity and readability
- Emotional connection and persuasion

Tone: ${tone}
Audience: ${audience}
Purpose: ${purpose}

Provide a comprehensive content improvement including:
1. Rewritten content with improved flow and engagement
2. Style and tone adjustments
3. Audience-specific language recommendations
4. Structure and organization improvements
5. Call-to-action suggestions (if applicable)
6. Readability enhancements
7. Emotional appeal improvements

Format your response with the improved content and detailed explanations of the changes made.`;

    return callSpecializedAI(prompt, content, context);
}

// Accessibility Expert implementation
export async function accessibilityExpert(
    content: string,
    contentType: string = 'text',
    imageDescription: string = '',
    context: string = ''
): Promise<{ content: Array<{ type: string, text: string }> }> {
    const prompt = `You are a specialized accessibility expert focused on making content inclusive for all users.

Your expertise includes:
- WCAG 2.1 AA compliance
- Screen reader optimization
- Keyboard navigation
- Color contrast and visual accessibility
- Alternative text for images
- Heading structure and semantic HTML
- Focus management and ARIA labels

Content type: ${contentType}
${imageDescription ? `Image description: ${imageDescription}` : ''}

Provide a comprehensive accessibility analysis including:
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

    return callSpecializedAI(prompt, content, context);
}

// Copy Editor implementation
export async function copyEditor(
    content: string,
    styleGuide: string = 'AP',
    focusAreas: string[] = ['grammar', 'spelling', 'punctuation'],
    context: string = ''
): Promise<{ content: Array<{ type: string, text: string }> }> {
    const prompt = `You are a professional copy editor with expertise in grammar, style, and clarity.

Your expertise includes:
- Grammar and syntax correction
- Spelling and punctuation
- Style guide compliance
- Clarity and conciseness
- Consistency and flow
- Fact-checking and accuracy

Style guide: ${styleGuide}
Focus areas: ${focusAreas.join(', ')}

Provide a comprehensive editing analysis including:
1. Corrected version of the content
2. Grammar and spelling corrections
3. Style guide compliance notes
4. Clarity and conciseness improvements
5. Consistency checks
6. Punctuation and formatting corrections
7. Flow and readability enhancements
8. Specific editing recommendations

Format your response with the edited content and detailed explanations of all changes made.`;

    return callSpecializedAI(prompt, content, context);
}

// Social Media Expert implementation
export async function socialMediaExpert(
    content: string,
    platform: string = 'twitter',
    postType: string = 'text',
    tone: string = 'casual',
    includeHashtags: boolean = true,
    context: string = ''
): Promise<{ content: Array<{ type: string, text: string }> }> {
    const prompt = `You are a social media expert specializing in creating engaging content for various platforms.

Your expertise includes:
- Platform-specific optimization
- Character limits and formatting
- Hashtag strategy and research
- Engagement optimization
- Viral content techniques
- Brand voice adaptation
- Call-to-action optimization

Platform: ${platform}
Post type: ${postType}
Tone: ${tone}
Include hashtags: ${includeHashtags}

Provide a comprehensive social media optimization including:
1. Platform-optimized version of the content
2. Character count analysis
3. Hashtag suggestions (if requested)
4. Engagement optimization tips
5. Visual content suggestions (if applicable)
6. Timing and posting recommendations
7. Cross-platform adaptation suggestions
8. Call-to-action optimization
9. Brand voice consistency notes
10. Viral potential assessment

Format your response with the optimized content and detailed platform-specific recommendations.`;

    return callSpecializedAI(prompt, content, context);
}

// Technical Writer implementation
export async function technicalWriter(
    content: string,
    audienceLevel: string = 'intermediate',
    contentType: string = 'documentation',
    includeExamples: boolean = true,
    context: string = ''
): Promise<{ content: Array<{ type: string, text: string }> }> {
    const prompt = `You are a technical writing expert specializing in clear, accurate technical documentation.

Your expertise includes:
- Technical concept explanation
- Step-by-step tutorials
- API documentation
- Troubleshooting guides
- User manuals and guides
- Code documentation
- Complex topic simplification

Audience level: ${audienceLevel}
Content type: ${contentType}
Include examples: ${includeExamples}

Provide a comprehensive technical writing improvement including:
1. Clear, accurate technical explanation
2. Step-by-step breakdown (if applicable)
3. Code examples and snippets (if requested)
4. Troubleshooting considerations
5. Common pitfalls and warnings
6. Related concepts and links
7. Visual aids suggestions
8. User experience improvements
9. Terminology explanations
10. Advanced vs. beginner versions (if applicable)

Format your response with the improved technical content and detailed explanations.`;

    return callSpecializedAI(prompt, content, context);
}

// Marketing Expert implementation
export async function marketingExpert(
    content: string,
    campaignGoal: string = 'engagement',
    targetAudience: string = 'general consumers',
    includeCta: boolean = true,
    urgencyLevel: string = 'medium',
    context: string = ''
): Promise<{ content: Array<{ type: string, text: string }> }> {
    const prompt = `You are a marketing expert specializing in persuasive, conversion-focused content.

Your expertise includes:
- Marketing psychology and persuasion
- Call-to-action optimization
- Emotional appeal and storytelling
- Brand messaging and positioning
- Conversion optimization
- A/B testing strategies
- Customer journey mapping

Campaign goal: ${campaignGoal}
Target audience: ${targetAudience}
Include CTA: ${includeCta}
Urgency level: ${urgencyLevel}

Provide a comprehensive marketing optimization including:
1. Persuasive, conversion-focused content
2. Emotional appeal enhancements
3. Call-to-action optimization (if requested)
4. Urgency and scarcity techniques
5. Social proof integration
6. Benefit-focused messaging
7. Audience-specific language
8. Brand voice consistency
9. Conversion funnel considerations
10. A/B testing suggestions

Format your response with the optimized marketing content and detailed strategy recommendations.`;

    return callSpecializedAI(prompt, content, context);
}
