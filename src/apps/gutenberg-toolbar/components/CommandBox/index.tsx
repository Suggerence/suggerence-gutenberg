import { useState, useEffect, useRef } from '@wordpress/element';
import { Button, TextareaControl, Notice, Flex, FlexItem, KeyboardShortcuts } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { BlockTitle, BlockIcon } from '@wordpress/block-editor';
import { useCommandStore } from '@/apps/gutenberg-toolbar/stores/commandStore';
import { useGutenbergAI } from '@/apps/gutenberg-toolbar/hooks/useGutenbergAI';
import { AudioButton } from '@/shared/components/AudioButton';

export const CommandBox = ({
    onClose,
    onExecute,
    placeholder,
    mode = 'default'
}: CommandBoxProps) => {
    const {
        isExecuting,
        error,
        setExecuting,
        setResult,
        setError
    } = useCommandStore();

    const { executeCommand: defaultExecuteCommand, isLoading: mcpLoading } = useGutenbergAI();
    const [inputValue, setInputValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Use custom execute function if provided, otherwise use default
    const executeCommand = onExecute || defaultExecuteCommand;

    // Get selected block information
    const selectedBlock = useSelect((select) => {
        // @ts-ignore - WordPress types not available
        const { getSelectedBlock } = select('core/block-editor');
        // @ts-ignore - WordPress types not available
        return getSelectedBlock?.();
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

    // Focus textarea when component mounts
    useEffect(() => {
        // Use timeout to ensure the textarea is rendered
        const timeout = setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }, 100);

        return () => clearTimeout(timeout);
    }, []);

    const handleAudioMessage = async (audioMessage: any) => {
        try {
            setExecuting(true);
            setError(null);

            // Pass the full multimodal message to executeCommand
            const success = await executeCommand(audioMessage);

            if (success) {
                setResult(__('Audio command executed successfully!', 'suggerence'));
                setInputValue('');
                onClose?.();
            } else {
                setError(__('Audio command execution failed. Please try again.', 'suggerence'));
            }
        } catch (error) {
            setError(__('An error occurred while executing the audio command.', 'suggerence'));
            console.error('Audio command execution error:', error);
        } finally {
            setExecuting(false);
        }
    };

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

            <div aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(1px, 1px, 1px, 1px)' }}>
				{isLoading
					? (mcpLoading ? __('Loading…', 'suggerence') : __('Executing…', 'suggerence'))
					: (error ? __('Error', 'suggerence') : '')}
			</div>

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
                        placeholder={placeholder || __('"Ask me to modify the content of the block"', 'suggerence')}
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
                                                icon={selectedBlock.name ? (window as any).wp?.blocks?.getBlockType?.(selectedBlock.name)?.icon : undefined}
                                                showColors={true}
                                            />
                                            <BlockTitle clientId={selectedBlock.clientId} />
                                        </div>
                                    )}
                                </FlexItem>
                                <FlexItem style={{ display: 'flex', gap: '4px' }}>
                                    <AudioButton
                                        onAudioMessage={handleAudioMessage}
                                        inputValue={inputValue}
                                        isLoading={isLoading}
                                        size="small"
                                        showError={false}
                                    />
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