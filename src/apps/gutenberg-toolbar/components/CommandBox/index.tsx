import { useState, useEffect, useRef } from '@wordpress/element';
import { Button, TextareaControl, Notice, Flex, FlexItem, KeyboardShortcuts } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
// @ts-ignore - WordPress types not available
import { BlockTitle, BlockIcon } from '@wordpress/block-editor';
import { useCommandStore } from '@/apps/gutenberg-toolbar/stores/commandStore';
import { useGutenbergAI } from '@/apps/gutenberg-toolbar/hooks/use-gutenberg-ai';

export const CommandBox = ({ onClose }: CommandBoxProps) => {
    const {
        isExecuting,
        error,
        setExecuting,
        setResult,
        setError
    } = useCommandStore();

    const { executeCommand, isLoading: mcpLoading } = useGutenbergAI();
    const [inputValue, setInputValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Get selected block information
    const selectedBlock = useSelect((select) => {
        // @ts-ignore - WordPress types not available
        const { getSelectedBlock } = select('core/block-editor');
        // @ts-ignore - WordPress types not available
        return getSelectedBlock?.();
    }, []);

    // Focus textarea when component mounts
    useEffect(() => {
        // Use timeout to ensure the textarea is rendered
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }, 100);
    }, []);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!inputValue.trim() || isLoading) return;

        try {
            setExecuting(true);
            setError(null);

            const success = await executeCommand(inputValue.trim());

            if (success) {
                setResult(__('Command executed successfully!', 'suggerence'));
                setInputValue('');
                // Close the dropdown after successful execution
                onClose?.();
            } else {
                setError(__('Command execution failed. Please try again.', 'suggerence'));
            }
        } catch (error) {
            setError(__('An error occurred while executing the command.', 'suggerence'));
            console.error('Command execution error:', error);
        } finally {
            setExecuting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const isLoading = isExecuting || mcpLoading;


    return (
        <div
            className="suggerence-command-box"
            style={{
                width: '320px',
                padding: '4px',
            }}
        >
            <KeyboardShortcuts
                shortcuts={{
                    'mod+enter': () => handleSubmit(),
                }}
            />

            {/* Status Notice */}
            {error && (
                <Notice status="error">{error}</Notice>
            )}

            <div>
                    <TextareaControl
                        label={__('AI Command', 'suggerence')}
                        hideLabelFromVision
                        value={inputValue}
                        onChange={(value: string) => setInputValue(value)}
                        onKeyDown={handleKeyDown}
                        placeholder={__('"Ask me to modify the content of the block"', 'suggerence')}
                        disabled={isLoading}
                        rows={2}
                        ref={textareaRef}
                    />

                    {!isLoading ? (
                            <Flex gap={2} align="center" justify="space-between">
                                <FlexItem>
                                    {selectedBlock && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <BlockIcon
                                                // @ts-ignore - WordPress types not available
                                                icon={selectedBlock.name ? (window as any).wp?.blocks?.getBlockType?.(selectedBlock.name)?.icon : undefined}
                                                showColors={true}
                                                style={{
                                                    width: '14px',
                                                    height: '14px',
                                                    flexShrink: 0
                                                }}
                                            />
                                            <BlockTitle
                                                clientId={selectedBlock.clientId}
                                                context="list-view"
                                            />
                                        </div>
                                    )}
                                </FlexItem>
                                <FlexItem>
                                    <Button
                                        variant="primary"
                                        size="small"
                                        onClick={handleSubmit}
                                        disabled={!inputValue.trim() || isLoading}
                                        isBusy={isLoading}
                                        aria-label={__('Send command', 'suggerence')}
                                    >
                                        {__('Send', 'suggerence')}
                                    </Button>
                                </FlexItem>
                            </Flex>
                        ) : (
                            <div style={{ marginTop: '12px', fontSize: '13px', color: '#757575', fontStyle: 'italic' }}>
                                {mcpLoading
                                    ? __('Loading...', 'suggerence')
                                    : __('Executing...', 'suggerence')
                                }
                            </div>
                        )}
            </div>
        </div>
    );
};