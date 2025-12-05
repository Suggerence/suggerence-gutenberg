import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export const MediaSelector = ({ isOpen, onClose, onSelect }: MediaSelectorProps) => {
    const [isMediaFrameOpen, setIsMediaFrameOpen] = useState(false);

    useEffect(() => {
        if (!isOpen || isMediaFrameOpen) return;

        // Check if wp.media is available
        if (!(window as any).wp?.media) {
            console.error('WordPress media library not available');
            onClose();
            return;
        }

        setIsMediaFrameOpen(true);

        // Create WordPress media gallery
        const mediaFrame = (window as any).wp.media({
            title: __('Select Image for Context', 'suggerence'),
            button: {
                text: __('Add to Context', 'suggerence')
            },
            multiple: false,
            library: {
                type: 'image'
            }
        });

        mediaFrame.on('select', () => {
            const attachment = mediaFrame.state().get('selection').first().toJSON();

            const imageData = {
                id: attachment.id,
                url: attachment.url,
                alt: attachment.alt || '',
                title: attachment.title || '',
                description: attachment.description || '',
                width: attachment.width,
                height: attachment.height
            };

            const description = attachment.alt || attachment.title || `Image ${attachment.id}`;

            onSelect(imageData, description);
            setIsMediaFrameOpen(false);
            onClose();
        });

        mediaFrame.on('close', () => {
            setIsMediaFrameOpen(false);
            onClose();
        });

        mediaFrame.open();

    }, [isOpen, isMediaFrameOpen]);

    return null;
};