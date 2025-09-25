import { useState, useRef, useEffect } from '@wordpress/element';
import {
    Toolbar,
    ToolbarGroup,
    ToolbarButton,
    DropdownMenu,
    ColorPalette,
    RangeControl,
    SelectControl,
    Popover
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
    formatBold,
    formatItalic,
    textColor,
    alignLeft,
    alignCenter,
    alignRight,
    check
} from '@wordpress/icons';
import { useDrawingCanvasStore } from '../../stores/drawingCanvasStore';

interface TextEditorProps {
    isOpen: boolean;
    onClose: () => void;
    position: { x: number; y: number } | null;
    onAddText: () => void;
}

const colorOptions = [
    { name: 'Black', color: '#000000' },
    { name: 'Red', color: '#ff0000' },
    { name: 'Blue', color: '#0000ff' },
    { name: 'Green', color: '#00ff00' },
    { name: 'Yellow', color: '#ffff00' },
    { name: 'Orange', color: '#ffa500' },
    { name: 'Purple', color: '#800080' },
    { name: 'White', color: '#ffffff' },
    { name: 'Gray', color: '#808080' }
];

const fontOptions = [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: 'Times New Roman, serif' },
    { label: 'Courier New', value: 'Courier New, monospace' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' }
];

export const TextEditor = ({ isOpen, onClose, position, onAddText }: TextEditorProps) => {
    const { textInput, setTextInput, drawingState, updateSettings } = useDrawingCanvasStore();
    const [showToolbar, setShowToolbar] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    // Use position directly since we'll use absolute positioning relative to canvas container

    // Simple click outside handler - just close without saving
    // useEffect(() => {
    //     if (!isOpen) return;

    //     const handleClickOutside = (e: MouseEvent) => {
    //         if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
    //             onClose();
    //         }
    //     };

    //     // Small delay to avoid immediate closing
    //     setTimeout(() => {
    //         document.addEventListener('click', handleClickOutside);
    //     }, 100);

    //     return () => {
    //         document.removeEventListener('click', handleClickOutside);
    //     };
    // }, [isOpen, onClose]);

    const handleApply = () => {
        if (textInput.trim()) {
            onAddText();
        }
        onClose();
    };

    // Focus textarea and show toolbar when opened
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            // Use a small delay to ensure the element is rendered
            setTimeout(() => {
                textareaRef.current?.focus();
                textareaRef.current?.select(); // Select any existing text
            }, 10);
            setShowToolbar(true);
        }
    }, [isOpen]);

    if (!isOpen || !position) return null;

    return null; // Will be rendered inside Canvas container
};