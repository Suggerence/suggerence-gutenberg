import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { MessageCircle, GripVertical, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SuggerenceSurface } from '@/shared/components/SuggerenceSurface';
import { ThemeProvider } from 'next-themes';
import { useWebsocketStore } from '../stores/websocket';
import { useConversationsStore } from '../stores/conversations';
import { Conversation } from './Chat/Conversation';
import { InputArea } from './Chat/InputArea';
import { WebsocketHandler } from './Chat/WebsocketHandler';

interface FloatingChatWindowProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FloatingChatWindow = ({ isOpen, onClose }: FloatingChatWindowProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 500, height: 800 });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);
    
    const windowRef = useRef<HTMLDivElement>(null);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });
    
    const { connect, disconnect } = useWebsocketStore();
    const { clearConversation, currentConversationId } = useConversationsStore();

    // Connect WebSocket when window opens
    useEffect(() => {
        if (isOpen) {
            connect();
        } else {
            disconnect();
        }
    }, [isOpen, connect, disconnect]);

    const handleClearConversation = () => {
        if (currentConversationId) {
            clearConversation(currentConversationId);
        }
    };

    // Initialize position on mount
    useEffect(() => {
        if (isOpen) {
            const defaultWidth = 500;
            const defaultHeight = 800;
            const padding = 16;
            
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                const maxX = Math.max(0, window.innerWidth - defaultWidth - padding);
                const maxY = Math.max(0, window.innerHeight - defaultHeight - padding);
                
                setPosition({
                    x: Math.max(padding, maxX),
                    y: Math.max(padding, maxY),
                });
                setSize({ width: defaultWidth, height: defaultHeight });
            });
        }
    }, [isOpen]);

    // Constrain window to viewport
    useEffect(() => {
        if (!isOpen) return;

        const constrainPosition = () => {
            setPosition(prev => {
                const maxX = Math.max(0, window.innerWidth - size.width);
                const maxY = Math.max(0, window.innerHeight - size.height);
                return {
                    x: Math.max(0, Math.min(prev.x, maxX)),
                    y: Math.max(0, Math.min(prev.y, maxY)),
                };
            });
        };

        // Constrain on mount and resize
        constrainPosition();

        const handleResize = () => {
            constrainPosition();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isOpen, size]);

    // Handle dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.resize-handle')) return;
        if ((e.target as HTMLElement).closest('button')) return;
        
        setIsDragging(true);
        // Store the initial mouse position and window position
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
        e.preventDefault();
        e.stopPropagation();
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            // Calculate new position based on mouse position and initial offset
            const newX = e.clientX - dragStartPos.current.x;
            const newY = e.clientY - dragStartPos.current.y;
            
            // Constrain to viewport
            const maxX = Math.max(0, window.innerWidth - size.width);
            const maxY = Math.max(0, window.innerHeight - size.height);
            
            setPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY)),
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        // Use capture phase to ensure we catch the events
        document.addEventListener('mousemove', handleMouseMove, { passive: false });
        document.addEventListener('mouseup', handleMouseUp, { passive: false });
        // Prevent text selection while dragging
        document.body.style.userSelect = 'none';

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.userSelect = '';
        };
    }, [isDragging, size]);

    // Handle resizing
    const handleResizeStart = (e: React.MouseEvent, handle: string) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        setResizeHandle(handle);
        resizeStartPos.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height,
            posX: position.x,
            posY: position.y,
        };
    };

    useEffect(() => {
        if (!isResizing || !resizeHandle) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - resizeStartPos.current.x;
            const deltaY = e.clientY - resizeStartPos.current.y;

            let newWidth = resizeStartPos.current.width;
            let newHeight = resizeStartPos.current.height;
            let newX = resizeStartPos.current.posX;
            let newY = resizeStartPos.current.posY;

            if (resizeHandle.includes('right')) {
                newWidth = Math.max(320, Math.min(800, resizeStartPos.current.width + deltaX));
                // Constrain to viewport
                if (newX + newWidth > window.innerWidth) {
                    newWidth = window.innerWidth - newX;
                }
            }
            if (resizeHandle.includes('left')) {
                newWidth = Math.max(320, Math.min(800, resizeStartPos.current.width - deltaX));
                newX = resizeStartPos.current.posX + (resizeStartPos.current.width - newWidth);
                // Constrain to viewport
                if (newX < 0) {
                    newX = 0;
                    newWidth = resizeStartPos.current.posX + resizeStartPos.current.width;
                }
            }
            if (resizeHandle.includes('bottom')) {
                newHeight = Math.max(400, Math.min(800, resizeStartPos.current.height + deltaY));
                // Constrain to viewport
                if (newY + newHeight > window.innerHeight) {
                    newHeight = window.innerHeight - newY;
                }
            }
            if (resizeHandle.includes('top')) {
                newHeight = Math.max(400, Math.min(800, resizeStartPos.current.height - deltaY));
                newY = resizeStartPos.current.posY + (resizeStartPos.current.height - newHeight);
                // Constrain to viewport
                if (newY < 0) {
                    newY = 0;
                    newHeight = resizeStartPos.current.posY + resizeStartPos.current.height;
                }
            }

            setSize({ width: newWidth, height: newHeight });
            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            setResizeHandle(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, resizeHandle]);

    if (!isOpen) return null;

    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <div
                ref={windowRef}
                className={cn(
                    "fixed z-999998 pointer-events-auto",
                    "bg-card/95 backdrop-blur-xl",
                    "border border-border/50",
                    "rounded-xl shadow-2xl",
                    "transition-all duration-300",
                    isDragging && "cursor-move",
                    "theme-editor-chat-window"
                )}
                style={{
                    left: `${Math.max(0, Math.min(position.x, window.innerWidth - size.width))}px`,
                    top: `${Math.max(0, Math.min(position.y, window.innerHeight - size.height))}px`,
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                    minWidth: '320px',
                    minHeight: '400px',
                    maxWidth: '800px',
                    maxHeight: '800px',
                }}
            >
                {/* Resize handles */}
                <>
                    <div
                        className="resize-handle absolute top-0 left-0 w-full h-2 cursor-ns-resize hover:bg-primary/20 transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, 'top')}
                    />
                    <div
                        className="resize-handle absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-primary/20 transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, 'bottom')}
                    />
                    <div
                        className="resize-handle absolute top-0 left-0 h-full w-2 cursor-ew-resize hover:bg-primary/20 transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, 'left')}
                    />
                    <div
                        className="resize-handle absolute top-0 right-0 h-full w-2 cursor-ew-resize hover:bg-primary/20 transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, 'right')}
                    />
                    <div
                        className="resize-handle absolute top-0 left-0 w-4 h-4 cursor-nwse-resize hover:bg-primary/20 transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, 'top-left')}
                    />
                    <div
                        className="resize-handle absolute top-0 right-0 w-4 h-4 cursor-nesw-resize hover:bg-primary/20 transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, 'top-right')}
                    />
                    <div
                        className="resize-handle absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize hover:bg-primary/20 transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
                    />
                    <div
                        className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-primary/20 transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
                    />
                </>

                {/* Header */}
                <div
                    className={cn(
                        "flex items-center justify-between px-4 py-3",
                        "border-b border-border/50",
                        "bg-linear-to-r from-card/90 via-card/80 to-card/90 backdrop-blur-sm",
                        "rounded-t-xl",
                        "select-none",
                        isDragging && "cursor-move"
                    )}
                    onMouseDown={handleMouseDown}
                >
                    <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
                        <div className="relative">
                            <MessageCircle className="size-4 text-primary" />
                            <span className="absolute -top-1 -right-1 size-2 bg-green-500 rounded-full border-2 border-card animate-pulse" />
                        </div>
                        <h3 className="text-sm font-semibold text-primary! m-0">
                            {__("AI Site Editor Assistant", "suggerence")}
                        </h3>
                    </div>
                    <div className="flex items-center gap-1">
                        {currentConversationId && (
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={handleClearConversation}
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                aria-label={__("Clear conversation", "suggerence")}
                                title={__("Clear conversation", "suggerence")}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={onClose}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            aria-label={__("Close", "suggerence")}
                        >
                            <X className="size-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <SuggerenceSurface className="flex flex-col h-[calc(100%-3.5rem)] overflow-hidden">
                    <WebsocketHandler />
                    <div className="flex-1 overflow-y-auto p-4 sugg-scrollbar">
                        <Conversation />
                    </div>
                    <InputArea />
                </SuggerenceSurface>
                </div>
            </ThemeProvider>
        );
    };
