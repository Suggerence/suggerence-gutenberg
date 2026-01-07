import { useState } from '@wordpress/element';
import { FloatingChatButton } from './components/FloatingChatButton';
import { FloatingChatWindow } from './components/FloatingChatWindow';
import { ToolsPanel } from './components/ToolsPanel';
import '@/apps/theme-editor/style.scss';

export const ThemeEditor = () => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <>
            <ToolsPanel />
            <div className="fixed bottom-8 right-16 z-999999 pointer-events-none">
                <FloatingChatButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
            </div>
            <FloatingChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};