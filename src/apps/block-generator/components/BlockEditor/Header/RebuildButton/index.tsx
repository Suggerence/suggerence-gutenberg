import { __ } from '@wordpress/i18n';
import { useState, useMemo, useEffect } from '@wordpress/element';
import { update } from '@wordpress/icons';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@wordpress/components';

import { getBlockQueryOptions } from '@/shared/block-generation/query-options';

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';
import { useWebsocketStore } from '@/apps/block-generator/stores/websocket';

export const BlockEditorHeaderRebuildButton = () =>
{
    const [isRebuilding, setIsRebuilding] = useState(false);
    const { selectedBlockId } = useBlocksStore();
    const { addMessageHandler, send: sendWebsocketMessage } = useWebsocketStore();

    const { data: block } = useQuery(getBlockQueryOptions(selectedBlockId ?? ''));

    const hasChanges = useMemo(() =>
    {
        if (!block || !block.src_files || !block.lastBuildFileSnapshots) return true;

        const sourceFiles = block.src_files.filter(file =>
        {
            const filePath = file.path ?? file.filename;
            return filePath && filePath.length > 0 && !filePath.startsWith('./build/');
        });

        for (const file of sourceFiles) {
            const filePath = file.path ?? file.filename;
            if (!filePath) continue;

            const snapshotContent = block.lastBuildFileSnapshots[filePath];
            const currentContent = file.content;

            if (snapshotContent !== currentContent) return true;
        }

        for (const snapshotPath in block.lastBuildFileSnapshots) {
            if (snapshotPath.startsWith('./build/')) continue;

            const fileExists = sourceFiles.some(file =>
            {
                const filePath = file.path ?? file.filename;
                return filePath && filePath.length > 0 && filePath === snapshotPath;
            });

            if (!fileExists) return true;
        }

        return false;
    }, [block?.src_files, block?.lastBuildFileSnapshots]);

    useEffect(() =>
    {
        const handler = (event: MessageEvent) =>
        {
            try {
                const message = JSON.parse(event.data);

                if (message.type === 'build_block' && message.data.status === 'built') {
                    setIsRebuilding(false);
                }
            }
            catch (error) {
                // Ignore parsing errors
            }
        }

        const removeHandler = addMessageHandler(handler);

        return () => {
            removeHandler();
        };
    }, []);

    const handleRebuild = async () =>
    {
        if (!selectedBlockId) return;

        setIsRebuilding(true);

        try {
            sendWebsocketMessage('manual_rebuild', { blockId: selectedBlockId });

            setTimeout(() => {
                setIsRebuilding(false);
            }, 30000);
        }
        catch (error) {
            console.error('Error triggering rebuild:', error);
            setIsRebuilding(false);
        }
    }

    return (
        <Button variant='secondary' icon={update} onClick={handleRebuild} disabled={isRebuilding || !hasChanges} className='justify-center' isBusy={isRebuilding} title={!hasChanges ? __('No changes detected since last build', 'suggerence-blocks') : __('Rebuild and reload the block', 'suggerence-blocks')}>
            {isRebuilding ? __('Rebuilding...', 'suggerence-blocks') : __('Rebuild & Reload', 'suggerence-blocks')}
        </Button>
    );
}