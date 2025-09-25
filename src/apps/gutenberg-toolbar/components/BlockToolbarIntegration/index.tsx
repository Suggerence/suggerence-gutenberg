import { useEffect, useState, useRef, useCallback } from '@wordpress/element';
import { ToolbarDropdownMenu, ToolbarGroup, ToolbarButton, Button, TextareaControl, Notice, Flex, FlexItem, Popover } from '@wordpress/components';
import { BlockControls, Inserter } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { SuggerenceIcon } from '@/components/SuggerenceIcon';
import { CommandBox } from '@/apps/gutenberg-toolbar/components/CommandBox';
import { Mic, Square } from 'lucide-react';
import apiFetch from '@wordpress/api-fetch';

// Speech-to-Text component for the dropdown
const SpeechToTextDropdown = ({ onClose, selectedBlock, updateBlockAttributes, initialTranscript }: any) => {
    const [transcript, setTranscript] = useState(initialTranscript || '');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const applyTranscript = useCallback(() => {
        if (!selectedBlock || !transcript.trim()) return;

        if (selectedBlock.name === 'core/paragraph') {
            const currentContent = selectedBlock.attributes?.content || '';
            const newContent = currentContent + (currentContent ? ' ' : '') + transcript.trim();
            
            updateBlockAttributes(selectedBlock.clientId, {
                content: newContent
            });
            
            setTranscript('');
            onClose?.();
        }
    }, [selectedBlock, transcript, updateBlockAttributes, onClose]);

    const clearTranscript = useCallback(() => {
        setTranscript('');
        setError(null);
    }, []);

    return (
        <div style={{ width: '320px', padding: '12px' }}>
            {error && (
                <Notice status="error" isDismissible={false}>
                    {error}
                </Notice>
            )}

            <div style={{ marginBottom: '12px' }}>
                <TextareaControl
                    label={__('Transcript', 'suggerence')}
                    value={transcript}
                    onChange={(value: string) => setTranscript(value)}
                    placeholder={__('Your transcribed text will appear here...', 'suggerence')}
                    rows={4}
                />
            </div>

            <Flex gap={2} align="center" justify="space-between">
                <FlexItem>
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={clearTranscript}
                    >
                        {__('Clear', 'suggerence')}
                    </Button>
                </FlexItem>
                <FlexItem>
                    <Button
                        variant="primary"
                        size="small"
                        onClick={applyTranscript}
                        disabled={!transcript.trim()}
                    >
                        {__('Apply to Block', 'suggerence')}
                    </Button>
                </FlexItem>
            </Flex>
        </div>
    );
};

// Add toolbar button to all blocks
const withToolbarButton = createHigherOrderComponent((BlockEdit) => {
    return (props: any) => {
        // Check if current block is selected
        const isBlockSelected = useSelect((select) => {
            const selectedBlockId = select(blockEditorStore).getSelectedBlockClientId();
            return selectedBlockId === props.clientId;
        }, [props.clientId]);

        // Check if current block is a paragraph
        const isParagraphBlock = props.name === 'core/paragraph';

        // Speech-to-text state
        const [isRecording, setIsRecording] = useState(false);
        const [isProcessing, setIsProcessing] = useState(false);
        const [showTranscriptDropdown, setShowTranscriptDropdown] = useState(false);
        const [transcript, setTranscript] = useState('');
        const [error, setError] = useState<string | null>(null);
        
        const mediaRecorderRef = useRef<MediaRecorder | null>(null);
        const audioChunksRef = useRef<Blob[]>([]);
        const streamRef = useRef<MediaStream | null>(null);

        const { updateBlockAttributes } = useDispatch('core/block-editor') as any;

        // Start audio recording
        const startRecording = useCallback(async () => {
            if (!navigator.mediaDevices || !window.MediaRecorder) {
                setError(__('Audio recording is not supported in this browser.', 'suggerence'));
                return;
            }

            try {
                setError(null);
                audioChunksRef.current = [];

                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        sampleRate: 44100
                    } 
                });
                
                streamRef.current = stream;
                
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'audio/webm;codecs=opus'
                });
                
                mediaRecorderRef.current = mediaRecorder;
                
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };
                
                mediaRecorder.onstop = () => {
                    processAudio();
                };
                
                mediaRecorder.onerror = (event) => {
                    console.error('MediaRecorder error:', event);
                    setError(__('Recording error occurred. Please try again.', 'suggerence'));
                    setIsRecording(false);
                };
                
                mediaRecorder.start(1000);
                setIsRecording(true);
                
            } catch (err: any) {
                console.error('Error starting recording:', err);
                let errorMessage = __('Failed to access microphone. Please check permissions.', 'suggerence');
                
                if (err.name === 'NotAllowedError') {
                    errorMessage = __('Microphone access denied. Please allow microphone access and try again.', 'suggerence');
                } else if (err.name === 'NotFoundError') {
                    errorMessage = __('No microphone found. Please connect a microphone and try again.', 'suggerence');
                } else if (err.name === 'NotSupportedError') {
                    errorMessage = __('Audio recording is not supported in this browser.', 'suggerence');
                }
                
                setError(errorMessage);
                setIsRecording(false);
            }
        }, []);

        // Stop audio recording
        const stopRecording = useCallback(() => {
            if (mediaRecorderRef.current && isRecording) {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
            }
            
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        }, [isRecording]);

        // Process recorded audio
        const processAudio = useCallback(async () => {
            if (audioChunksRef.current.length === 0) return;

            setIsProcessing(true);
            setError(null);

            try {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                
                const reader = new FileReader();
                reader.onload = async () => {
                    const base64 = (reader.result as string).split(',')[1];
                    
                    try {
                        const response = await apiFetch({
                            path: '/suggerence-gutenberg/ai-providers/v1/providers/audio',
                            method: 'POST',
                            data: {
                                audio: base64,
                                provider: 'gemini',
                                format: 'webm',
                                language: 'en-US'
                            }
                        });

                        const apiResponse = response as { success: boolean; transcript?: string; error?: string };
                        if (apiResponse.success) {
                            setTranscript(apiResponse.transcript || '');
                            setShowTranscriptDropdown(true);
                        } else {
                            setError(apiResponse.error || __('Failed to transcribe audio.', 'suggerence'));
                        }
                    } catch (apiError) {
                        console.error('API error:', apiError);
                        setError(__('Failed to transcribe audio. Please try again.', 'suggerence'));
                    } finally {
                        setIsProcessing(false);
                    }
                };
                
                reader.readAsDataURL(audioBlob);
                
            } catch (err) {
                console.error('Error processing audio:', err);
                setError(__('Failed to process audio.', 'suggerence'));
                setIsProcessing(false);
            }
        }, []);

        const handleMicClick = useCallback(() => {
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
            }
        }, [isRecording, startRecording, stopRecording]);

        return (
            <>
                <BlockEdit {...props} />
                {isBlockSelected && (
                    <BlockControls>
                        <ToolbarGroup>
                            <ToolbarDropdownMenu
                                icon={<div style={{ color: '#d22178' }}><SuggerenceIcon /></div>}
                                label={__('AI Command', 'suggerence')}
                                popoverProps={{
                                    placement: 'bottom-start',
                                    offset: 8,
                                }}
                            >
                                {({ onClose }) => (
                                    <div style={{ padding: 0 }}>
                                        <CommandBox onClose={onClose} />
                                    </div>
                                )}
                            </ToolbarDropdownMenu>
                            
                            {/* Speech-to-Text button for paragraph blocks */}
                            {isParagraphBlock && (
                                <>
                                    {!showTranscriptDropdown ? (
                                        <ToolbarButton
                                            icon={isRecording ? <Square size={20} fill="none" strokeWidth={1.5} /> : <Mic size={20} fill="none" strokeWidth={1.5} />}
                                            label={isRecording ? __('Stop Recording', 'suggerence') : __('Start Recording', 'suggerence')}
                                            onClick={handleMicClick}
                                            isPressed={isRecording}
                                        />
                                    ) : (
                                        <ToolbarDropdownMenu
                                            icon={<Mic size={20} fill="none" strokeWidth={1.5} />}
                                            label={__('Transcript', 'suggerence')}
                                            defaultOpen={true}
                                            popoverProps={{
                                                placement: 'bottom-start',
                                                offset: 8,
                                            }}
                                        >
                                            {({ onClose }) => (
                                                <SpeechToTextDropdown 
                                                    onClose={() => {
                                                        onClose();
                                                        setShowTranscriptDropdown(false);
                                                    }}
                                                    selectedBlock={props}
                                                    updateBlockAttributes={updateBlockAttributes}
                                                    initialTranscript={transcript}
                                                />
                                            )}
                                        </ToolbarDropdownMenu>
                                    )}
                                </>
                            )}
                        </ToolbarGroup>
                    </BlockControls>
                )}
            </>
        );
    };
}, 'withToolbarButton');

// Simple mic button for empty paragraphs - just show in toolbar
const EmptyParagraphMicButton = ({ onClick, isRecording, isProcessing }: any) => {
    return (
        <ToolbarButton
            icon={isRecording ? <Square size={20} fill="none" strokeWidth={1.5} /> : <Mic size={20} fill="none" strokeWidth={1.5} />}
            label={isRecording ? __('Stop Recording', 'suggerence') : __('Start Recording', 'suggerence')}
            onClick={onClick}
            isPressed={isRecording}
            isBusy={isProcessing}
        />
    );
};

// Component to inject mic button into empty block inserter popovers
const EmptyBlockInserterMic = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showTranscriptDropdown, setShowTranscriptDropdown] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [selectedEmptyBlock, setSelectedEmptyBlock] = useState<any>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const observerRef = useRef<MutationObserver | null>(null);

    const { updateBlockAttributes, selectBlock, getSelectedBlockClientId, getBlock } = useDispatch('core/block-editor') as any;
    const { getSelectedBlockClientId: selectBlockId } = useSelect('core/block-editor') as any;

    // Find empty paragraph blocks and inject mic buttons
    const injectMicButtons = useCallback(() => {
        // Find all empty block inserter popovers
        const inserterPopovers = document.querySelectorAll('.block-editor-block-list__block-side-inserter-popover .block-editor-block-list__empty-block-inserter');

        inserterPopovers.forEach((inserterContainer) => {
            // Check if we already added a mic button
            if (inserterContainer.querySelector('.suggerence-empty-mic-button')) {
                return;
            }

            // Create mic button element
            const micButton = document.createElement('button');
            micButton.className = 'components-button suggerence-empty-mic-button has-icon is-next-40px-default-size';
            micButton.style.cssText = `
                margin-right: 8px;
                min-width: 40px;
                height: 40px;
                padding: 6px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background-color: transparent;
                border: 1px solid #949494;
                border-radius: 2px;
                cursor: pointer;
                transition: all 0.2s ease;
            `;

            const micIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
            const stopIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="6" width="12" height="12" rx="2" ry="2"/></svg>`;

            micButton.innerHTML = isRecording ? stopIcon : micIcon;
            micButton.title = isRecording ? 'Stop Recording' : 'Start Recording';

            // Add click handler
            micButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleMicClick();
            });

            // Insert before the inserter button
            const inserterButton = inserterContainer.querySelector('.block-editor-inserter__toggle');
            if (inserterButton && inserterButton.parentNode) {
                inserterButton.parentNode.insertBefore(micButton, inserterButton);
            }
        });
    }, [isRecording]);

    // Start audio recording
    const startRecording = useCallback(async () => {
        if (!navigator.mediaDevices || !window.MediaRecorder) {
            setError(__('Audio recording is not supported in this browser.', 'suggerence'));
            return;
        }

        try {
            setError(null);
            audioChunksRef.current = [];

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                processAudio();
            };

            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event);
                setError(__('Recording error occurred. Please try again.', 'suggerence'));
                setIsRecording(false);
            };

            mediaRecorder.start(1000);
            setIsRecording(true);

        } catch (err: any) {
            console.error('Error starting recording:', err);
            let errorMessage = __('Failed to access microphone. Please check permissions.', 'suggerence');

            if (err.name === 'NotAllowedError') {
                errorMessage = __('Microphone access denied. Please allow microphone access and try again.', 'suggerence');
            } else if (err.name === 'NotFoundError') {
                errorMessage = __('No microphone found. Please connect a microphone and try again.', 'suggerence');
            } else if (err.name === 'NotSupportedError') {
                errorMessage = __('Audio recording is not supported in this browser.', 'suggerence');
            }

            setError(errorMessage);
            setIsRecording(false);
        }
    }, []);

    // Stop audio recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, [isRecording]);

    // Process recorded audio
    const processAudio = useCallback(async () => {
        if (audioChunksRef.current.length === 0) return;

        setIsProcessing(true);
        setError(null);

        try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];

                try {
                    const response = await apiFetch({
                        path: '/suggerence-gutenberg/ai-providers/v1/providers/audio',
                        method: 'POST',
                        data: {
                            audio: base64,
                            provider: 'gemini',
                            format: 'webm',
                            language: 'en-US'
                        }
                    });

                    const apiResponse = response as { success: boolean; transcript?: string; error?: string };
                    if (apiResponse.success) {
                        setTranscript(apiResponse.transcript || '');
                        setShowTranscriptDropdown(true);

                        // Try to find the target empty paragraph block
                        const selectedBlockId = selectBlockId();
                        if (selectedBlockId) {
                            const block = getBlock(selectedBlockId);
                            if (block && block.name === 'core/paragraph' && (!block.attributes?.content || block.attributes.content.trim() === '')) {
                                setSelectedEmptyBlock(block);
                            }
                        }
                    } else {
                        setError(apiResponse.error || __('Failed to transcribe audio.', 'suggerence'));
                    }
                } catch (apiError) {
                    console.error('API error:', apiError);
                    setError(__('Failed to transcribe audio. Please try again.', 'suggerence'));
                } finally {
                    setIsProcessing(false);
                }
            };

            reader.readAsDataURL(audioBlob);

        } catch (err) {
            console.error('Error processing audio:', err);
            setError(__('Failed to process audio.', 'suggerence'));
            setIsProcessing(false);
        }
    }, [selectBlockId, getBlock]);

    const handleMicClick = useCallback(() => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }, [isRecording, startRecording, stopRecording]);

    const applyTranscript = useCallback(() => {
        if (!transcript.trim() || !selectedEmptyBlock) return;

        updateBlockAttributes(selectedEmptyBlock.clientId, {
            content: transcript.trim()
        });

        setTranscript('');
        setShowTranscriptDropdown(false);
        setSelectedEmptyBlock(null);
    }, [transcript, selectedEmptyBlock, updateBlockAttributes]);

    // Set up DOM observer to watch for empty block inserters
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            let shouldInject = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const element = node as Element;
                            if (element.classList.contains('block-editor-block-list__block-side-inserter-popover') ||
                                element.querySelector('.block-editor-block-list__block-side-inserter-popover')) {
                                shouldInject = true;
                            }
                        }
                    });
                }
            });

            if (shouldInject) {
                setTimeout(injectMicButtons, 100); // Small delay to ensure DOM is ready
            }
        });

        observerRef.current = observer;
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Initial injection
        setTimeout(injectMicButtons, 100);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [injectMicButtons]);

    // Update existing buttons when recording state changes
    useEffect(() => {
        const micIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
        const stopIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="6" width="12" height="12" rx="2" ry="2"/></svg>`;

        const micButtons = document.querySelectorAll('.suggerence-empty-mic-button');
        micButtons.forEach((button) => {
            const htmlButton = button as HTMLElement;
            htmlButton.innerHTML = isRecording ? stopIcon : micIcon;
            htmlButton.title = isRecording ? 'Stop Recording' : 'Start Recording';
            htmlButton.style.backgroundColor = isRecording ? '#ff6b6b' : 'transparent';
            htmlButton.style.borderColor = isRecording ? '#ff6b6b' : '#949494';
        });
    }, [isRecording]);

    return (
        <>
            {showTranscriptDropdown && (
                <div style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    width: '320px'
                }}>
                    {error && (
                        <Notice status="error" isDismissible={false}>
                            {error}
                        </Notice>
                    )}

                    <div style={{ marginBottom: '12px' }}>
                        <TextareaControl
                            label={__('Transcript', 'suggerence')}
                            value={transcript}
                            onChange={(value: string) => setTranscript(value)}
                            placeholder={__('Your transcribed text will appear here...', 'suggerence')}
                            rows={4}
                        />
                    </div>

                    <Flex gap={2} align="center" justify="space-between">
                        <FlexItem>
                            <Button
                                variant="secondary"
                                size="small"
                                onClick={() => {
                                    setTranscript('');
                                    setError(null);
                                }}
                            >
                                {__('Clear', 'suggerence')}
                            </Button>
                        </FlexItem>
                        <FlexItem>
                            <Button
                                variant="primary"
                                size="small"
                                onClick={applyTranscript}
                                disabled={!transcript.trim() || !selectedEmptyBlock}
                            >
                                {__('Apply to Block', 'suggerence')}
                            </Button>
                        </FlexItem>
                    </Flex>
                </div>
            )}
        </>
    );
};

export const BlockToolbarIntegration = () => {
    useEffect(() => {
        // Add the toolbar button to all blocks
        addFilter(
            'editor.BlockEdit',
            'suggerence/add-toolbar-button',
            withToolbarButton,
            20
        );
    }, []);

    return <EmptyBlockInserterMic />;
};