import { useEffect, useState, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';

import { getBlockQueryOptions } from '@/shared/block-generation/query-options';
import { useBlocksStore } from '@/apps/block-generator/stores/blocks';
import { Spinner } from '@/components/ui/spinner';
import { getBlockFile } from '@/lib/block';

interface PreviewState {
    html: string | null;
    loading: boolean;
    error: string | null;
    viewJs: string | null;
    styleCss: string | null;
}

interface BlockEditorPreviewFrontendProps {
    blocks: any[];
}

export const BlockEditorPreviewFrontend = ({ blocks }: BlockEditorPreviewFrontendProps) => {
    const { selectedBlockId } = useBlocksStore();
    const { data: block } = useQuery(getBlockQueryOptions(selectedBlockId ?? ''));

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [previewState, setPreviewState] = useState<PreviewState>({
        html: null,
        loading: true,
        error: null,
        viewJs: null,
        styleCss: null
    });

    const blockName = `suggerence/${block?.slug || selectedBlockId || 'unknown'}`;

    const getCurrentAttributes = useCallback(() => {
        // Extract attributes from blocks if available, otherwise fall back to defaults
        if (blocks.length > 0 && blocks[0].attributes) {
            return blocks[0].attributes;
        }

        if (!block?.attributes) return {};

        return Object.entries(block.attributes).reduce((acc: Record<string, unknown>, [key, value]) => {
            acc[key] = value.default;
            return acc;
        }, {});
    }, [blocks, block?.attributes]);

    const fetchServerRender = useCallback(async (blockName: string, attributes: Record<string, unknown>): Promise<string | null> => {
        try {
            const response = await apiFetch<{ rendered: string }>({
                path: `/wp/v2/block-renderer/${encodeURIComponent(blockName)}`,
                method: 'GET',
                data: {
                    context: 'edit',
                    attributes: attributes
                }
            });

            return response?.rendered || null;
        } catch (error) {
            return null;
        }
    }, []);

    const renderClientSide = useCallback((blockName: string, attributes: Record<string, unknown>): string | null => {
        const wp = (window as any).wp;
        const blockType = wp.blocks.getBlockType(blockName);

        if (!blockType || !blockType.save) {
            return null;
        }

        try {
            const saveElement = wp.element.createElement(
                blockType.save,
                { attributes }
            );

            return wp.element.renderToString(saveElement);
        } catch (error) {
            console.error('Error rendering client-side:', error);
            return null;
        }
    }, []);

    const renderPreview = useCallback(async () => {
        if (!blockName || blockName === 'suggerence/unknown') return;

        setPreviewState(prev => ({ ...prev, loading: true, error: null }));

        const attributes = getCurrentAttributes();

        // Try to load view.js if available
        let viewJsContent: string | null = null;
        let styleCssContent: string | null = null;
        if (block) {
            try {
                const viewJsFile = await getBlockFile(block, './build/view.js');
                if (viewJsFile.success && viewJsFile.data?.content) {
                    viewJsContent = viewJsFile.data.content;
                }
            } catch (error) {
                // view.js is optional, so we don't treat this as an error
                console.log('view.js not found or failed to load:', error);
            }

            // Try to load style.css or style-index.css if available
            try {
                // Try style.css first, then style-index.css
                let styleFile = await getBlockFile(block, './build/style-index.css');
                if (!styleFile.success) {
                    styleFile = await getBlockFile(block, './build/index.css');
                }
                if (styleFile.success && styleFile.data?.content) {
                    styleCssContent = styleFile.data.content;
                }
            } catch (error) {
                // CSS is optional, so we don't treat this as an error
                console.log('index.css not found or failed to load:', error);
            }
        }

        try {
            const serverHtml = await fetchServerRender(blockName, attributes);
            if (serverHtml) {
                setPreviewState({
                    html: serverHtml,
                    loading: false,
                    error: null,
                    viewJs: viewJsContent,
                    styleCss: styleCssContent
                });
                return;
            }
        } catch (error) {
            console.log('Server render not available, trying client render');
        }

        try {
            const clientHtml = renderClientSide(blockName, attributes);
            if (clientHtml) {
                setPreviewState({
                    html: clientHtml,
                    loading: false,
                    error: null,
                    viewJs: viewJsContent,
                    styleCss: styleCssContent
                });
                return;
            }
        } catch (error) {
            console.error('Client render failed:', error);
        }

        setPreviewState({
            html: null,
            loading: false,
            error: 'Unable to render block preview',
            viewJs: viewJsContent,
            styleCss: styleCssContent
        });
    }, [blockName, getCurrentAttributes, fetchServerRender, renderClientSide, blocks, block]);

    useEffect(() => {
        renderPreview();
    }, [renderPreview]);

    useEffect(() => {
        if (!iframeRef.current || !previewState.html) return;

        const iframe = iframeRef.current;

        const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
            .map(el => el.outerHTML)
            .join('\n');

        // Include block's style.css if available
        const blockStyleCss = previewState.styleCss 
            ? `<style id="block-style-css">${previewState.styleCss}</style>`
            : '';

        // Inject parent window's wp object into iframe
        const wpScript = `
            <script>
                window.wp = window.parent.wp;
                window.ReactJSXRuntime = window.parent.ReactJSXRuntime;
            </script>
        `;

        // Include view.js script if available
        const viewJsScript = previewState.viewJs 
            ? `<script type="module">${previewState.viewJs}</script>`
            : '';

        const content = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Block Preview</title>
                ${styles}
                ${blockStyleCss}
                <style>
                    html {
                        padding: 2.5rem;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        height: auto !important;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
                        line-height: 1.6;
                        background: white !important;
                    }
                    .wp-block {
                        margin-bottom: 1em;
                    }
                </style>
            </head>
            <body>
                ${previewState.html}
                ${wpScript}
                ${viewJsScript}
            </body>
            </html>
        `;

        iframe.srcdoc = content;
    }, [previewState.html, previewState.viewJs, previewState.styleCss]);

    if (previewState.loading) {
        return (
            <div className='size-full flex flex-col items-center justify-center'>
                <div className='flex items-center gap-4'>
                    <Spinner className='size-8' />
                    <span className='text-2xl'>{__('Loading preview...', 'suggerence-blocks')}</span>
                </div>
            </div>
        );
    }

    if (previewState.error) {
        return (
            <div className='size-full flex flex-col items-center justify-center'>
                <div className='text-center'>
                    <p className='text-xl text-red-600 mb-2'>
                        {__('Preview Error', 'suggerence-blocks')}
                    </p>
                    <p className='text-gray-600'>{previewState.error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className='size-full bg-white overflow-auto!'>
            <iframe
                ref={iframeRef}
                className='size-full border-0'
                title={__('Frontend Preview', 'suggerence-blocks')}
            />
        </div>
    );
};