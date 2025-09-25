import { __experimentalVStack as VStack, __experimentalText as Text, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Volume2, Play, Pause } from 'lucide-react';
import { useState, useRef, useEffect } from '@wordpress/element';

export const UserMessage = ({message}: {message: MCPClientMessage}) => {
    const messageDate = new Date(message.date);
    const timeString = messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Check if content is multi-modal (array) or simple text
    const isMultiModal = Array.isArray(message.content);
    let textContent = '';
    let hasAudio = false;
    let audioData = '';

    if (isMultiModal) {
        // Extract text content and check for audio
        (message.content as any[]).forEach((item: any) => {
            if (item.type === 'text') {
                textContent += item.text;
            } else if (item.type === 'audio') {
                hasAudio = true;
                audioData = item.source.data;
            }
        });
    } else {
        // Simple text message
        textContent = message.content as string;
    }

    const playAudio = () => {
        if (!audioData) return;

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        const audioBlob = new Blob([
            new Uint8Array(atob(audioData).split('').map(char => char.charCodeAt(0)))
        ], { type: 'audio/webm' });

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onplay = () => setIsPlaying(true);
        audio.onpause = () => setIsPlaying(false);
        audio.onended = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
            setIsPlaying(false);
            URL.revokeObjectURL(audioUrl);
        };

        audioRef.current = audio;
        audio.play().catch(console.error);
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setIsPlaying(false);
        }
    };

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    return (
        <div style={{ paddingLeft: '1rem', marginLeft: 'auto' }}>
            <VStack spacing={1} justify="end">
                <div
                    style={{
                        padding: '8px 12px',
                        backgroundColor: '#0073aa',
                        color: 'white'
                    }}
                >
                    <VStack spacing={1}>
                        {textContent && (
                            <Text color="white" size="14" style={{ overflowWrap: 'anywhere' }}>
                                {textContent}
                            </Text>
                        )}

                        {hasAudio && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                                <Button
                                    onClick={isPlaying ? stopAudio : playAudio}
                                    size="small"
                                    variant="tertiary"
                                    icon={isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                    style={{
                                        minWidth: 'auto',
                                        height: '24px',
                                        padding: '4px',
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        color: 'white'
                                    }}
                                    aria-label={isPlaying ? __('Stop audio', 'suggerence') : __('Play audio', 'suggerence')}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.9 }}>
                                    <Volume2 size={14} />
                                    <span>{__('Audio message', 'suggerence')}</span>
                                </div>
                            </div>
                        )}
                    </VStack>
                </div>

                <Text variant="muted" size="11">
                    {timeString}
                </Text>
            </VStack>
        </div>
    );
};