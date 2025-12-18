import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingChatButtonProps {
    isOpen: boolean;
    onClick: () => void;
}

export const FloatingChatButton = ({ isOpen, onClick }: FloatingChatButtonProps) => {
    if (isOpen) return null;

    return (
        <Button
            onClick={onClick}
            className={cn(
                "size-14 rounded-full shadow-lg",
                "bg-gradient-to-br from-primary via-primary/90 to-primary/80",
                "hover:from-primary/90 hover:via-primary/80 hover:to-primary/70",
                "border-2 border-primary/20",
                "transition-all duration-300 ease-out",
                "hover:scale-110 hover:shadow-xl hover:shadow-primary/25",
                "active:scale-95",
                "text-white",
                "pointer-events-auto",
                "animate-in fade-in slide-in-from-bottom-4"
            )}
            aria-label="Open AI Assistant"
        >
            <MessageCircle className="size-6" />
        </Button>
    );
};
