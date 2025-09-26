import { useState, useRef, useCallback } from '@wordpress/element';
import { Button, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Mic, Square } from 'lucide-react';

interface AudioButtonProps {
    onAudioMessage?: (audioMessage: any) => void;
    onAudioProcessed?: (audioBlob: Blob, base64: string) => void;
    inputValue?: string;
    isLoading?: boolean;
    disabled?: boolean;
    showError?: boolean;
    size?: 'compact' | 'small' | 'default';
    className?: string;
    style?: React.CSSProperties;
}

export const AudioButton = ({
    onAudioMessage,
    onAudioProcessed,
    inputValue = '',
    isLoading = false,
    disabled = false,
    showError = true,
    size = 'compact',
    className,
    style
}: AudioButtonProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const [audioError, setAudioError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    // Start audio recording
    const startRecording = useCallback(async () => {
        if (!navigator.mediaDevices || !window.MediaRecorder) {
            setAudioError(__('Audio recording is not supported in this browser.', 'suggerence'));
            return;
        }

        try {
            setAudioError(null);
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
                setAudioError(__('Recording error occurred. Please try again.', 'suggerence'));
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

            setAudioError(errorMessage);
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

        setIsProcessingAudio(true);
        setAudioError(null);

        try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];

                // Call onAudioProcessed callback if provided
                if (onAudioProcessed) {
                    onAudioProcessed(audioBlob, base64);
                    setIsProcessingAudio(false);
                    return;
                }

                // Create structured audio message if onAudioMessage callback is provided
                if (onAudioMessage) {
                    const messageContent = [];

                    // Add text if provided
                    if (inputValue.trim()) {
                        messageContent.push({
                            type: 'text',
                            text: inputValue.trim()
                        });
                    }

                    // Add audio content
                    messageContent.push({
                        type: 'audio',
                        source: {
                            data: base64,
                            media_type: 'audio/webm'
                        }
                    });

                    const audioMessage = {
                        role: 'user',
                        content: messageContent,
                        date: new Date().toISOString()
                    };

                    onAudioMessage(audioMessage);
                }

                setIsProcessingAudio(false);
            };

            reader.readAsDataURL(audioBlob);

        } catch (err) {
            console.error('Error processing audio:', err);
            setAudioError(__('Failed to process audio.', 'suggerence'));
            setIsProcessingAudio(false);
        }
    }, [inputValue, onAudioMessage, onAudioProcessed]);

    const handleMicClick = useCallback(() => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }, [isRecording, startRecording, stopRecording]);

    return (
        <div className={className}>
            {showError && audioError && (
                <Notice status="error" isDismissible onRemove={() => setAudioError(null)}>
                    {audioError}
                </Notice>
            )}

            <Button
                onClick={handleMicClick}
                disabled={disabled || isLoading || isProcessingAudio}
                icon={isRecording ? <Square size={20} fill="none" strokeWidth={1.5} /> : <Mic size={20} fill="none" strokeWidth={1.5} />}
                size={size}
                isPressed={isRecording}
                isBusy={isProcessingAudio}
                aria-label={isRecording ? __("Stop recording", "suggerence") : __("Record audio message", "suggerence")}
                title={isRecording ? __("Click to stop recording audio", "suggerence") : __("Click to record an audio message", "suggerence")}
                style={{
                    backgroundColor: isRecording ? '#ff6b6b' : undefined,
                    borderColor: isRecording ? '#ff6b6b' : undefined,
                    color: isRecording ? 'white' : undefined,
                    ...style
                }}
            />
        </div>
    );
};