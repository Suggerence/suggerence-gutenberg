interface ContextOption {
    id: string;
    label: string;
    icon: any;
    description?: string;
}

interface SelectedContext {
    id: string;
    type: string;
    label: string;
    data?: any;
}

interface ContextMenuBadgeProps {
    onContextSelect?: (context: SelectedContext) => void;
}