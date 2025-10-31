import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Volume2, Play, Pause } from 'lucide-react';
import { useState, useRef, useEffect } from '@wordpress/element';

export const UserMessage = ({message}: {message: MCPClientMessage}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Check if content is multi-modal (array) or simple text
    const isMultiModal = Array.isArray(message.content);
    let textContent = '';
    let hasAudio = false;
    let audioData = '';

    if (isMultiModal) {
        // Extract text content and check for audio
        (message.content as unknown as any[]).forEach((item: any) => {
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
        <div className="pb-4 pl-8 ml-auto max-w-[90%]">
            <div className="px-3.5 py-2.5 bg-primary text-primary-foreground rounded-xl rounded-br-sm shadow-sm">
                <div className="space-y-1">
                    {textContent && (
                        <p className="text-sm leading-relaxed break-words">
                            {textContent}
                        </p>
                    )}

                    {hasAudio && (
                        <div className="flex items-center gap-2 text-xs mt-1">
                            <Button
                                onClick={isPlaying ? stopAudio : playAudio}
                                size="small"
                                variant="tertiary"
                                icon={isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                style={{
                                    minWidth: 'auto',
                                    height: '26px',
                                    padding: '4px 8px',
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                    border: '1px solid rgba(255,255,255,0.25)',
                                    borderRadius: '6px',
                                    color: 'white'
                                }}
                                aria-label={isPlaying ? __('Stop audio', 'suggerence') : __('Play audio', 'suggerence')}
                            />
                            <div className="flex items-center gap-1 opacity-95">
                                <Volume2 size={14} />
                                <span>{__('Audio message', 'suggerence')}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};