import { useThinkingContentStore } from './thinking-content-store';
import { Response } from './response';

export const ThinkingContent = () => {
    // This component will re-render when store updates, but parent won't
    const content = useThinkingContentStore((state) => state.content);

    return <Response className="grid gap-2">{content}</Response>;
};
