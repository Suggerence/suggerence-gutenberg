import { useState, useEffect, useRef } from '@wordpress/element';
import { Button, TextareaControl, Card, CardBody, Notice, Flex, FlexItem, KeyboardShortcuts, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { arrowUp } from '@wordpress/icons';

import { useCommandStore } from '@/apps/gutenberg-toolbar/stores/commandStore';
import { useGutenbergAI } from '@/apps/gutenberg-toolbar/hooks/use-gutenberg-ai';

export const CommandBox = () => {
    const {
        isCommandBoxOpen,
        isExecuting,
        error,
        position,
        closeCommandBox,
        setExecuting,
        setResult,
        setError,
        clearResult
    } = useCommandStore();

    const { executeCommand, isLoading: mcpLoading } = useGutenbergAI();
    const [inputValue, setInputValue] = useState('');
    const boxRef = useRef<HTMLDivElement>(null);

    // Focus textarea when command box opens
    useEffect(() => {
        if (isCommandBoxOpen) {
            // WordPress TextareaControl doesn't expose ref directly,
            // but we can focus using a timeout and querySelector
            setTimeout(() => {
                const textarea = document.querySelector('.suggerence-command-box textarea');
                if (textarea instanceof HTMLTextAreaElement) {
                    textarea.focus();
                }
            }, 100);
        }
    }, [isCommandBoxOpen]);

    // Reset input and clear results when command box closes
    useEffect(() => {
        if (!isCommandBoxOpen) {
            setInputValue('');
            clearResult();
        }
    }, [isCommandBoxOpen, clearResult]);

    // Handle clicks outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
                closeCommandBox();
            }
        };

        if (isCommandBoxOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isCommandBoxOpen, closeCommandBox]);

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
                closeCommandBox();
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
        } else if (e.key === 'Escape') {
            closeCommandBox();
        }
    };

    const isLoading = isExecuting || mcpLoading;

    if (!isCommandBoxOpen || !position) return null;

    return (
        <div
            ref={boxRef}
            className="suggerence-command-box"
            style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                zIndex: 9999999,
                width: '420px',
                maxWidth: '90vw',
                pointerEvents: 'auto',
            }}
        >
            <KeyboardShortcuts
                shortcuts={{
                    'mod+enter': () => handleSubmit(),
                    'escape': () => closeCommandBox(),
                }}
            />

            {/* Status Notice */}
            {error && (
                <Notice status="error">{error}</Notice>
            )}

            <Card size="small" elevation={3} style={{ position: 'relative', zIndex: 1 }}>
                <CardBody>
                    <TextareaControl
                        label={__('AI Command', 'suggerence')}
                        hideLabelFromVision
                        value={inputValue}
                        onChange={(value: string) => setInputValue(value)}
                        onKeyDown={handleKeyDown}
                        placeholder={__('"Add a paragraph with lorem ipsum"', 'suggerence')}
                        disabled={isLoading}
                        rows={4}
                    />

                    {!isLoading ? (
                            <Flex gap={2} align="center" justify="space-between">
                                <FlexItem>
                                    <SelectControl
                                        value="claude-3-haiku"
                                        options={[
                                            { label: 'Claude 3 Haiku', value: 'claude-3-haiku' }
                                        ]}
                                        onChange={() => {}} // Will be implemented later
                                        size="small"
                                        __nextHasNoMarginBottom
                                    />
                                </FlexItem>
                                <FlexItem>
                                    <Button
                                        variant="primary"
                                        size="small"
                                        onClick={handleSubmit}
                                        disabled={!inputValue.trim() || isLoading}
                                        isBusy={isLoading}
                                        icon={arrowUp}
                                        aria-label={__('Send command', 'suggerence')}
                                    />
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
                </CardBody>
            </Card>
        </div>
    );
};