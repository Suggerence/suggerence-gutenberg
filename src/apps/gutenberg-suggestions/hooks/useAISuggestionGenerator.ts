import { useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { useSuggestionStore } from '@/apps/gutenberg-suggestions/stores/suggestionStore';
import { useAI } from '@/apps/gutenberg-assistant/hooks/use-ai';
import { BlockSpecificMCPServerFactory } from '@/shared/mcps/servers/BlockSpecificMCPServerFactory';

export const useAISuggestionGenerator = () => {
    const { activeSuggestion, isGenerating, setActiveSuggestion, setIsGenerating } = useSuggestionStore();
    const { callAI } = useAI();

    const { selectedBlock } = useSelect((select) => {
        const { getSelectedBlock } = select('core/block-editor') as any;
        return {
            selectedBlock: getSelectedBlock()
        };
    }, []);

    useEffect(() => {
        const generateSuggestion = async () => {
            if (!activeSuggestion || activeSuggestion.suggestedValue || isGenerating) {
                return;
            }

            if (!selectedBlock || selectedBlock.clientId !== activeSuggestion.blockId) {
                return;
            }

            setIsGenerating(true);

            try {
                // Get the suggestions MCP server with AI service
                const suggestionsServer = BlockSpecificMCPServerFactory.getSuggestionsServer({ callAI });
                if (!suggestionsServer) {
                    console.error('Suggestions MCP server not available');
                    return;
                }

                let toolName = '';
                let toolArgs: Record<string, any> = {};

                switch (activeSuggestion.type) {
                    case 'alt-text':
                        toolName = 'generate_alt_text_suggestion';
                        toolArgs = {
                            blockId: activeSuggestion.blockId,
                            imageUrl: selectedBlock.attributes?.url,
                            context: `Generate alt text for ${activeSuggestion.blockName} block`
                        };
                        break;

                    case 'heading':
                        toolName = 'generate_heading_suggestion';
                        toolArgs = {
                            blockId: activeSuggestion.blockId,
                            content: selectedBlock.attributes?.content,
                            level: 2,
                            context: `Generate heading for ${activeSuggestion.blockName} block`
                        };
                        break;

                    default:
                        toolName = 'generate_content_suggestion';
                        toolArgs = {
                            blockId: activeSuggestion.blockId,
                            currentContent: selectedBlock.attributes?.content,
                            suggestionType: 'accessibility',
                            context: `Generate content suggestion for ${activeSuggestion.blockName} block`
                        };
                }

                // Execute the tool using the MCP server
                const response = await suggestionsServer.client.executeTool(toolName, toolArgs);

                if (response.content && response.content.length > 0) {
                    try {
                        // Parse the JSON response from the MCP server
                        const suggestionData = JSON.parse(response.content[0].text);
                        
                        let suggestedValue = '';
                        if (suggestionData.suggestedAltText) {
                            suggestedValue = suggestionData.suggestedAltText;
                        } else if (suggestionData.suggestedHeading) {
                            suggestedValue = suggestionData.suggestedHeading;
                        } else if (suggestionData.suggestedContent) {
                            suggestedValue = suggestionData.suggestedContent;
                        }

                        // Clean up the response
                        suggestedValue = suggestedValue
                            .replace(/^["']|["']$/g, '') // Remove quotes
                            .trim();

                        // Ensure it's not too long (125 characters max for alt text)
                        if (activeSuggestion.type === 'alt-text' && suggestedValue.length > 125) {
                            suggestedValue = suggestedValue.substring(0, 122) + '...';
                        }

                        // Only update if we have a meaningful suggestion
                        if (suggestedValue && suggestedValue.length > 0) {
                            setActiveSuggestion({
                                ...activeSuggestion,
                                suggestedValue
                            });
                        }
                    } catch (parseError) {
                        console.error('Error parsing MCP server response:', parseError);
                        // Fallback to using the raw content
                        const rawContent = response.content[0].text;
                        if (rawContent && rawContent.length > 0) {
                            setActiveSuggestion({
                                ...activeSuggestion,
                                suggestedValue: rawContent.substring(0, 125)
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Error generating suggestion:', error);
                // Keep the suggestion visible but without generated content
            } finally {
                setIsGenerating(false);
            }
        };

        generateSuggestion();
    }, [activeSuggestion, selectedBlock, isGenerating, setActiveSuggestion, setIsGenerating, callAI]);
};