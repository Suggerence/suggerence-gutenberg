interface MediaSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (imageData: any, description?: string) => void;
}