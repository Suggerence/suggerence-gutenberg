interface DrawingCanvasProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (imageData: string, description?: string) => void;
}