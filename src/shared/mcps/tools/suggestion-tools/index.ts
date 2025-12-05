import { select, dispatch } from '@wordpress/data';

// Tool for generating alt text suggestions
export const generateAltTextSuggestionTool: SuggerenceMCPResponseTool = {
    name: 'generate_alt_text_suggestion',
    description: 'Generate AI-powered alt text suggestions for images to improve accessibility',
    inputSchema: {
        type: 'object',
        properties: {
            block_id: {
                type: 'string',
                description: 'Block client ID (optional, uses selected block if not provided)'
            },
            image_url: {
                type: 'string',
                description: 'URL of the image to generate alt text for (optional, will use block attributes if not provided)'
            },
            context: {
                type: 'string',
                description: 'Additional context about the image or its purpose (optional)'
            }
        }
    },
    outputSchema: {
        type: 'object',
        properties: {
            suggested_alt_text: {
                type: 'string',
                description: 'The AI-generated alt text suggestion'
            },
            confidence: {
                type: 'number',
                description: 'Confidence score for the suggestion (0-1)'
            },
            reasoning: {
                type: 'string',
                description: 'Explanation of why this alt text was suggested'
            }
        }
    }
};

// Tool for generating heading suggestions
export const generateHeadingSuggestionTool: SuggerenceMCPResponseTool = {
    name: 'generate_heading_suggestion',
    description: 'Generate AI-powered heading suggestions to improve content structure and SEO',
    inputSchema: {
        type: 'object',
        properties: {
            block_id: {
                type: 'string',
                description: 'Block client ID (optional, uses selected block if not provided)'
            },
            content: {
                type: 'string',
                description: 'Current content to base the heading on (optional)'
            },
            level: {
                type: 'number',
                description: 'Heading level (1-6) for the suggestion',
                minimum: 1,
                maximum: 6
            },
            context: {
                type: 'string',
                description: 'Additional context about the content or page structure (optional)'
            }
        }
    },
    outputSchema: {
        type: 'object',
        properties: {
            suggested_heading: {
                type: 'string',
                description: 'The AI-generated heading suggestion'
            },
            seo_score: {
                type: 'number',
                description: 'SEO score for the heading (0-100)'
            },
            reasoning: {
                type: 'string',
                description: 'Explanation of why this heading was suggested'
            }
        }
    }
};

// Tool for generating general content suggestions
export const generateContentSuggestionTool: SuggerenceMCPResponseTool = {
    name: 'generate_content_suggestion',
    description: 'Generate AI-powered content suggestions to improve readability, SEO, or accessibility',
    inputSchema: {
        type: 'object',
        properties: {
            block_id: {
                type: 'string',
                description: 'Block client ID (optional, uses selected block if not provided)'
            },
            current_content: {
                type: 'string',
                description: 'Current content to improve (optional)'
            },
            suggestion_type: {
                type: 'string',
                description: 'Type of suggestion to generate',
                enum: ['readability', 'seo', 'accessibility', 'engagement', 'clarity']
            },
            context: {
                type: 'string',
                description: 'Additional context about the content or goals (optional)'
            }
        },
        required: ['suggestion_type']
    },
    outputSchema: {
        type: 'object',
        properties: {
            suggested_content: {
                type: 'string',
                description: 'The AI-generated content suggestion'
            },
            improvement_score: {
                type: 'number',
                description: 'Score indicating how much the suggestion improves the content (0-100)'
            },
            reasoning: {
                type: 'string',
                description: 'Explanation of why this content was suggested'
            }
        }
    }
};

// Tool for applying suggestions
export const applySuggestionTool: SuggerenceMCPResponseTool = {
    name: 'apply_suggestion',
    description: 'Apply a generated suggestion to a block',
    inputSchema: {
        type: 'object',
        properties: {
            block_id: {
                type: 'string',
                description: 'Block client ID (optional, uses selected block if not provided)'
            },
            suggestion_type: {
                type: 'string',
                description: 'Type of suggestion being applied',
                enum: ['alt-text', 'heading', 'content', 'title', 'description']
            },
            suggested_value: {
                type: 'string',
                description: 'The suggested value to apply'
            },
            attribute_name: {
                type: 'string',
                description: 'Specific attribute name to update (optional, will be inferred from suggestionType if not provided)'
            }
        },
        required: ['suggestion_type', 'suggested_value']
    },
    outputSchema: {
        type: 'object',
        properties: {
            success: {
                type: 'boolean',
                description: 'Whether the suggestion was successfully applied'
            },
            message: {
                type: 'string',
                description: 'Status message about the application'
            },
            updated_value: {
                type: 'string',
                description: 'The actual value that was applied'
            }
        }
    }
};

// Implementation functions
export async function generateAltTextSuggestion(
    blockId?: string,
    imageUrl?: string,
    context?: string
): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const { getSelectedBlock } = select('core/block-editor') as any;
        const selectedBlock = getSelectedBlock();
        const targetBlock = blockId ? 
            select('core/block-editor').getBlock(blockId) : 
            selectedBlock;

        if (!targetBlock) {
            return {
                content: [{
                    type: 'text',
                    text: 'No block selected or found'
                }]
            };
        }

        const finalImageUrl = imageUrl || targetBlock.attributes?.url;
        
        if (!finalImageUrl) {
            return {
                content: [{
                    type: 'text',
                    text: 'No image URL found for alt text generation'
                }]
            };
        }

        // This would integrate with the AI service
        // For now, return a structured response
        const suggestion = {
            suggestedAltText: `Descriptive alt text for image at ${finalImageUrl}`,
            confidence: 0.85,
            reasoning: `Generated based on image URL and context: ${context || 'No additional context provided'}`
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'alt_text_suggestion_success',
                    suggestion: suggestion
                }, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'alt_text_suggestion_failed',
                    error: `Error generating alt text suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

export async function generateHeadingSuggestion(
    blockId?: string,
    content?: string,
    level?: number,
    context?: string
): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const { getSelectedBlock } = select('core/block-editor') as any;
        const selectedBlock = getSelectedBlock();
        const targetBlock = blockId ? 
            select('core/block-editor').getBlock(blockId) : 
            selectedBlock;

        if (!targetBlock) {
            return {
                content: [{
                    type: 'text',
                    text: 'No block selected or found'
                }]
            };
        }

        const currentContent = content || targetBlock.attributes?.content || '';
        
        // This would integrate with the AI service
        const suggestion = {
            suggestedHeading: `Improved heading based on: ${currentContent}`,
            seoScore: 85,
            reasoning: `Generated heading level ${level || 2} with SEO optimization based on content analysis`
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'heading_suggestion_success',
                    suggestion: suggestion
                }, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'heading_suggestion_failed',
                    error: `Error generating heading suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

export async function generateContentSuggestion(
    blockId?: string,
    currentContent?: string,
    suggestionType?: string,
    context?: string
): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const { getSelectedBlock } = select('core/block-editor') as any;
        const selectedBlock = getSelectedBlock();
        const targetBlock = blockId ? 
            select('core/block-editor').getBlock(blockId) : 
            selectedBlock;

        if (!targetBlock) {
            return {
                content: [{
                    type: 'text',
                    text: 'No block selected or found'
                }]
            };
        }

        const content = currentContent || targetBlock.attributes?.content || '';
        
        // This would integrate with the AI service
        const suggestion = {
            suggestedContent: `Improved content for ${suggestionType || 'general'} improvement`,
            improvementScore: 80,
            reasoning: `Generated ${suggestionType || 'general'} improvement based on content analysis`
        };

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'content_suggestion_success',
                    suggestion: suggestion
                }, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'content_suggestion_failed',
                    error: `Error generating content suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

export async function applySuggestion(
    blockId?: string,
    suggestionType?: string,
    suggestedValue?: string,
    attributeName?: string
): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const { getSelectedBlock } = select('core/block-editor') as any;
        const { updateBlockAttributes } = dispatch('core/block-editor') as any;
        const selectedBlock = getSelectedBlock();
        const targetBlock = blockId ? 
            select('core/block-editor').getBlock(blockId) : 
            selectedBlock;

        if (!targetBlock) {
            return {
                content: [{
                    type: 'text',
                    text: 'No block selected or found'
                }]
            };
        }

        if (!suggestedValue) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'suggestion_failed',
                        error: 'No suggested value provided'
                    })
                }]
            };
        }

        // Determine the attribute to update based on suggestion type
        let attributeToUpdate = attributeName;
        if (!attributeToUpdate) {
            switch (suggestionType) {
                case 'alt-text':
                    attributeToUpdate = 'alt';
                    break;
                case 'heading':
                    attributeToUpdate = 'content';
                    break;
                case 'content':
                    attributeToUpdate = 'content';
                    break;
                case 'title':
                    attributeToUpdate = 'title';
                    break;
                case 'description':
                    attributeToUpdate = 'description';
                    break;
                default:
                    attributeToUpdate = 'content';
            }
        }

        // Apply the suggestion
        updateBlockAttributes(targetBlock.clientId, {
            [attributeToUpdate]: suggestedValue
        });

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    message: `Successfully applied ${suggestionType} suggestion`,
                    updatedValue: suggestedValue
                }, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'suggestion_failed',
                    error: `Error applying suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}
