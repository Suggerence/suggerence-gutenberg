import { useState, useRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { MessageCircle, GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SuggerenceSurface } from '@/shared/components/SuggerenceSurface';
import { ThemeProvider } from 'next-themes';

interface FloatingChatWindowProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FloatingChatWindow = ({ isOpen, onClose }: FloatingChatWindowProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 420, height: 600 });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);
    
    const windowRef = useRef<HTMLDivElement>(null);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

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
                    "fixed z-[999998] pointer-events-auto",
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
                        "bg-gradient-to-r from-card/90 via-card/80 to-card/90 backdrop-blur-sm",
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
                        <div className="flex-1 overflow-y-auto p-4 sugg-scrollbar">
                            {/* Chat messages area - placeholder for now */}
                            <div className="flex flex-col gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <MessageCircle className="size-4 text-primary" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="text-xs text-muted-foreground font-medium">
                                            {__("AI Assistant", "suggerence")}
                                        </div>
                                        <div className="text-sm text-foreground bg-muted/50 rounded-lg p-3">
                                            {__("Hello! I'm your AI Site Editor Assistant. I can help you design and customize your WordPress site. What would you like to work on today?", "suggerence")}
                                        </div>
                                    </div>
                                </div>

                                {/* Example user message */}
                                <div className="flex items-start gap-3 justify-end">
                                    <div className="flex-1 space-y-1 text-right">
                                        <div className="text-xs text-muted-foreground font-medium">
                                            {__("You", "suggerence")}
                                        </div>
                                        <div className="text-sm text-primary-foreground bg-primary rounded-lg p-3 inline-block">
                                            {__("Can you help me change the header color?", "suggerence")}
                                        </div>
                                    </div>
                                    <div className="size-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs text-primary-foreground font-semibold">U</span>
                                    </div>
                                </div>

                                {/* Example AI response */}
                                <div className="flex items-start gap-3">
                                    <div className="size-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 ring-2 ring-primary/20">
                                        <MessageCircle className="size-4 text-primary" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="text-xs text-muted-foreground font-medium">
                                            {__("AI Assistant", "suggerence")}
                                        </div>
                                        <div className="text-sm text-foreground bg-gradient-to-br from-muted/60 to-muted/40 rounded-lg p-3 border border-border/30 shadow-sm">
                                            {__("Of course! I can help you change the header color. Would you like to:", "suggerence")}
                                            <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                                                <li>{__("Use a specific color code?", "suggerence")}</li>
                                                <li>{__("Pick from a color palette?", "suggerence")}</li>
                                                <li>{__("Match an existing color from your site?", "suggerence")}</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Typing indicator example */}
                                <div className="flex items-start gap-3 opacity-60">
                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <MessageCircle className="size-4 text-primary" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="text-xs text-muted-foreground font-medium">
                                            {__("AI Assistant", "suggerence")}
                                        </div>
                                        <div className="text-sm text-foreground bg-muted/50 rounded-lg p-3 inline-flex items-center gap-1">
                                            <span className="size-1.5 bg-foreground rounded-full animate-pulse" />
                                            <span className="size-1.5 bg-foreground rounded-full animate-pulse delay-75" />
                                            <span className="size-1.5 bg-foreground rounded-full animate-pulse delay-150" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick actions */}
                        <div className="px-4 pb-2 border-b border-border/30">
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7"
                                >
                                    {__("Change colors", "suggerence")}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7"
                                >
                                    {__("Add block", "suggerence")}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-7"
                                >
                                    {__("Fix layout", "suggerence")}
                                </Button>
                            </div>
                        </div>

                        {/* Input area */}
                        <div className="border-t border-border/50 p-4 bg-card/50">
                            <div className="flex items-end gap-2">
                                <textarea
                                    placeholder={__("Ask me anything about your site...", "suggerence")}
                                    className={cn(
                                        "flex-1 min-h-[60px] max-h-[120px]",
                                        "px-3 py-2 rounded-lg",
                                        "bg-background border border-border",
                                        "text-sm text-foreground placeholder:text-muted-foreground",
                                        "resize-none focus:outline-none focus:ring-2 focus:ring-primary/50",
                                        "sugg-scrollbar"
                                    )}
                                    rows={2}
                                />
                                <Button
                                    size="icon"
                                    className="h-[60px] w-[60px] rounded-lg bg-gradient-to-br from-primary via-primary/90 to-primary/80 hover:from-primary/90 hover:via-primary/80 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                                    aria-label={__("Send message", "suggerence")}
                                >
                                    <MessageCircle className="size-5" />
                                </Button>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{__("Press Enter to send, Shift+Enter for new line", "suggerence")}</span>
                            </div>
                        </div>
                    </SuggerenceSurface>
                </div>
            </ThemeProvider>
        );
    };
