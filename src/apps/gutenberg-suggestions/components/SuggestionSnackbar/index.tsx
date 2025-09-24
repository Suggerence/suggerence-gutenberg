import { Button, Notice, Card, CardBody, CardHeader, Flex, FlexItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSuggestionStore } from '@/apps/gutenberg-suggestions/stores/suggestionStore';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { BlockSpecificMCPServerFactory } from '@/shared/mcps/servers/BlockSpecificMCPServerFactory';
import { useAI } from '@/apps/gutenberg-assistant/hooks/use-ai';

export const SuggestionSnackbar = () => {
    const { activeSuggestion, isGenerating, clearSuggestion } = useSuggestionStore();
    const [isApplying, setIsApplying] = useState(false);
    const [applyStatus, setApplyStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const { updateBlockAttributes } = useDispatch('core/block-editor');
    const { callAI } = useAI();

    if (!activeSuggestion) {
        return null;
    }

    const handleApply = async () => {
        if (!activeSuggestion.suggestedValue || isApplying) {
            return;
        }

        setIsApplying(true);
        setApplyStatus('idle');

        try {
            // Get the suggestions MCP server with AI service
            const suggestionsServer = BlockSpecificMCPServerFactory.getSuggestionsServer({ callAI });
            if (!suggestionsServer) {
                console.error('Suggestions MCP server not available');
                setApplyStatus('error');
                return;
            }

            // Use the MCP server to apply the suggestion
            const response = await suggestionsServer.client.executeTool('apply_suggestion', {
                blockId: activeSuggestion.blockId,
                suggestionType: activeSuggestion.type,
                suggestedValue: activeSuggestion.suggestedValue
            });

            if (response.content && response.content.length > 0) {
                try {
                    const result = JSON.parse(response.content[0].text);
                    if (result.success) {
                        setApplyStatus('success');
                        // Clear suggestion after a short delay to show success
                        setTimeout(() => {
                            clearSuggestion();
                        }, 1500);
                    } else {
                        setApplyStatus('error');
                    }
                } catch (parseError) {
                    console.error('Error parsing apply response:', parseError);
                    setApplyStatus('error');
                }
            } else {
                setApplyStatus('error');
            }
        } catch (error) {
            console.error('Error applying suggestion:', error);
            setApplyStatus('error');
        } finally {
            setIsApplying(false);
        }
    };

    const handleClose = () => {
        clearSuggestion();
    };

    const handleGenerate = () => {
        // This will trigger the AI generation in the hook
        // The button will show loading state while generating
    };

    return (
        <div style={{ 
            position: 'fixed', 
            top: '32px', 
            right: '20px', 
            zIndex: 999999,
            maxWidth: '400px'
        }}>
            <Card size="small">
                <CardHeader>
                    <Flex justify="space-between" align="center">
                        <FlexItem>
                            <strong>{activeSuggestion.message}</strong>
                        </FlexItem>
                        <FlexItem>
                            <Button
                                variant="tertiary"
                                size="small"
                                onClick={handleClose}
                                icon="no-alt"
                                label={__('Close', 'suggerence')}
                            />
                        </FlexItem>
                    </Flex>
                </CardHeader>
                
                <CardBody>
                    {activeSuggestion.suggestedValue && (
                        <Notice isDismissible={false} status="info">
                            <strong>✨ Suggested: </strong>
                            <em>{activeSuggestion.suggestedValue}</em>
                        </Notice>
                    )}

                    {applyStatus === 'error' && (
                        <Notice isDismissible={false} status="error">
                            ❌ Failed to apply suggestion. Please try again.
                        </Notice>
                    )}

                    <Flex justify="flex-end" gap={2} style={{ marginTop: '12px' }}>
                        {activeSuggestion.suggestedValue ? (
                            <Button
                                variant="primary"
                                size="small"
                                onClick={handleApply}
                                isBusy={isApplying}
                                disabled={isApplying || applyStatus === 'success'}
                            >
                                {isApplying ? __('Applying...', 'suggerence') : __('Apply Suggestion', 'suggerence')}
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                size="small"
                                isBusy={isGenerating}
                                disabled={isGenerating}
                                onClick={handleGenerate}
                            >
                                {isGenerating ? __('Generating...', 'suggerence') : __('Generate Suggestion', 'suggerence')}
                            </Button>
                        )}
                    </Flex>
                </CardBody>
            </Card>
        </div>
    );
};