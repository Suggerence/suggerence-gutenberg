import { select } from '@wordpress/data';
import { useContextStore } from '@/apps/gutenberg-assistant/stores/contextStore';
import { useBaseAIWebSocket } from '@/shared/hooks/useBaseAiWebSocket';

export const useAssistantAI = (): UseAITools => {
    /**
     * Get available block types with basic information
     */
    const getAvailableBlockTypes = () => {
        try {
            const { getBlockTypes } = select('core/blocks') as any;
            const blockTypes = getBlockTypes();

            return blockTypes.map((blockType: any) => ({
                name: blockType.name,
                title: blockType.title,
                description: blockType.description || '',
                category: blockType.category,
                keywords: blockType.keywords || [],
                supports: blockType.supports || {}
            })).filter((block: any) =>
                !block.name.includes('core/missing') &&
                !block.name.includes('core/freeform')
            );
        } catch (error) {
            console.warn('Suggerence: Could not retrieve available block types', error);
            return [];
        }
    };

    /**
     * Get comprehensive site context including Gutenberg blocks information
     */
    const getSiteContext = () => {
        // Get the CURRENT state from Zustand store instead of using stale closure
        const { selectedContexts } = useContextStore.getState();

        let baseContext = {};

        // Always add current Gutenberg blocks information
        try {
            // Use core/editor for the most up-to-date edited content
            const editorStore = select('core/editor') as any;
            const blockEditorStore = select('core/block-editor') as any;

            // Get methods - use core/block-editor for blocks (it has the latest)
            // but use getCurrentPost from core/editor for edited attributes
            const getBlocks = blockEditorStore?.getBlocks;
            const getBlock = blockEditorStore?.getBlock;
            const getSelectedBlockClientId = blockEditorStore?.getSelectedBlockClientId;
            const getSelectedBlock = blockEditorStore?.getSelectedBlock;
            const getEditedPostAttribute = editorStore?.getEditedPostAttribute;

            // Recursive function to process blocks and their inner blocks
            // IMPORTANT: Fetch fresh block data using getBlock() to get the latest content
            const processBlock = (blockId: string, position: number, parentId?: string): any => {
                // Get the FRESH block data from the store
                const freshBlock = getBlock(blockId);
                if (!freshBlock) return null;

                return {
                    position,
                    id: freshBlock.clientId,
                    name: freshBlock.name,
                    content: freshBlock.attributes?.content || '',
                    attributes: freshBlock.attributes,
                    parentId: parentId || null,
                    innerBlocks: freshBlock.innerBlocks?.map((innerBlock: any, innerIndex: number) =>
                        processBlock(innerBlock.clientId, innerIndex, freshBlock.clientId)
                    ).filter(Boolean) || []
                };
            };

            // Get all blocks with content and nested structure
            const blocks = getBlocks();

            // Process each block by fetching fresh data
            const blocksInfo = blocks
                .map((block: any, index: number) => processBlock(block.clientId, index))
                .filter(Boolean);

            // Get selected block info
            const selectedBlockId = getSelectedBlockClientId();
            const selectedBlock = getSelectedBlock();
            const selectedBlockInfo = selectedBlock ? {
                id: selectedBlockId,
                name: selectedBlock.name,
                content: selectedBlock.attributes?.content || '',
                position: blocks.findIndex((b: any) => b.clientId === selectedBlockId)
            } : null;

            // Get post information
            const postTitle = getEditedPostAttribute?.('title') || '';
            const postType = getEditedPostAttribute?.('type') || 'post';
            const postId = getEditedPostAttribute?.('id') || null;

            // Get available block types
            const availableBlockTypes = getAvailableBlockTypes();

            // // Auto-add selected image blocks as visual context
            // let contextsWithAutoImageBlock = [...(selectedContexts || [])];

            // // Check if the selected block is an image block
            // if (selectedBlock && (selectedBlock.name === 'core/image' || selectedBlock.name === 'core/cover')) {
            //     const imageUrl = selectedBlock.attributes?.url;

            //     // Only add if there's an image URL and it's not already in the contexts
            //     if (imageUrl) {
            //         const imageBlockContextId = `auto-image-block-${selectedBlockId}`;
            //         const alreadyExists = contextsWithAutoImageBlock.some(ctx =>
            //             ctx.id === imageBlockContextId ||
            //             (ctx.type === 'block' && ctx.data?.id === selectedBlockId)
            //         );

            //         if (!alreadyExists) {
            //             contextsWithAutoImageBlock.push({
            //                 id: imageBlockContextId,
            //                 type: 'block',
            //                 label: `Selected ${selectedBlock.name === 'core/cover' ? 'Cover' : 'Image'} Block`,
            //                 data: {
            //                     id: selectedBlockId,
            //                     name: selectedBlock.name,
            //                     attributes: selectedBlock.attributes
            //                 }
            //             });
            //         }
            //     }
            // }

            return {
                ...baseContext,
                gutenberg: {
                    post: {
                        id: postId,
                        title: postTitle,
                        type: postType,
                        totalBlocks: blocks.length
                    },
                    blocks: blocksInfo,
                    selectedBlock: selectedBlockInfo,
                    availableBlockTypes: availableBlockTypes,
                    lastUpdated: new Date().toISOString()
                },
                selectedContexts: selectedContexts
            };
        } catch (gutenbergError) {
            console.warn('Suggerence: Could not retrieve Gutenberg context', gutenbergError);
            return {
                ...baseContext,
                gutenberg: {
                    error: 'Could not access Gutenberg data',
                    lastUpdated: new Date().toISOString()
                },
                selectedContexts: selectedContexts || []
            };
        }
    };

    /**
     * Generate the system prompt payload for the AI assistant.
     * Only the dynamic variables are sent to the backend.
     */
    const getAssistantSystemPrompt = (site_context: any) => {
        const { gutenberg, selectedContexts } = site_context;

        return {
            promptId: 'gutenberg_assistant',
            variables: {
                gutenberg,
                selectedContexts
            }
        };
    };

    const { callAI, parseAIResponse } = useBaseAIWebSocket({
        getSystemPrompt: getAssistantSystemPrompt,
        getSiteContext
    });

    return {
        callAI,
        parseAIResponse
    };
};
