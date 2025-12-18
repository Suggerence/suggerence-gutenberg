import { nanoid } from 'nanoid';
import { useEffect, useState, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useQuery } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';

import { getBlockQueryOptions } from '@/shared/block-generation/query-options';
import { useBlocksStore } from '@/apps/block-generator/stores/blocks';
import { useConversationsStore } from '@/apps/block-generator/stores/conversations';
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
    const { addMessage } = useConversationsStore();

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

    // Listen for error messages from iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Verify message origin for security (adjust if needed)
            // For same-origin iframes, you can check event.origin
            if (event.data && event.data.type === 'IFRAME_ERROR') {
                const errorData = {
                    type: event.data.errorType || 'error',
                    message: event.data.message || 'Unknown error',
                    stack: event.data.stack,
                    timestamp: Date.now()
                };
                
                addMessage(selectedBlockId ?? '', { id: nanoid(), createdAt: new Date().toISOString(), type: 'suggestion', content: {
                    description: `An error occurred while testing out the block.`,
                    type: 'error',
                    data: errorData
                } });
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

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

        // Error handling script to capture all errors in iframe
        const errorHandlerScript = `
            <script>
                (function() {
                    // Function to send error to parent window
                    function sendErrorToParent(errorType, message, stack) {
                        try {
                            window.parent.postMessage({
                                type: 'IFRAME_ERROR',
                                errorType: errorType,
                                message: message,
                                stack: stack
                            }, '*'); // Use '*' for same-origin, or specify exact origin for security
                        } catch (e) {
                            // Fallback if postMessage fails
                            console.error('Failed to send error to parent:', e);
                        }
                    }

                    // Override console methods to capture logs
                    const originalConsole = {
                        error: console.error,
                        warn: console.warn,
                        log: console.log,
                        info: console.info
                    };

                    console.error = function(...args) {
                        originalConsole.error.apply(console, args);
                        const message = args.map(arg => 
                            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                        ).join(' ');
                        sendErrorToParent('console.error', message, new Error().stack);
                    };

                    console.warn = function(...args) {
                        originalConsole.warn.apply(console, args);
                        const message = args.map(arg => 
                            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                        ).join(' ');
                        sendErrorToParent('console.warn', message, new Error().stack);
                    };

                    // Capture unhandled errors
                    window.addEventListener('error', function(event) {
                        sendErrorToParent(
                            'unhandled-error',
                            event.message || 'Unhandled error',
                            event.error ? event.error.stack : event.filename + ':' + event.lineno + ':' + event.colno
                        );
                    }, true);

                    // Capture unhandled promise rejections
                    window.addEventListener('unhandledrejection', function(event) {
                        const reason = event.reason;
                        const message = reason instanceof Error 
                            ? reason.message 
                            : String(reason);
                        const stack = reason instanceof Error 
                            ? reason.stack 
                            : 'No stack trace available';
                        sendErrorToParent('unhandled-promise-rejection', message, stack);
                    }, true);
                })();
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
                ${errorHandlerScript}
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
        <div className='size-full overflow-auto! relative'>
            <iframe
                ref={iframeRef}
                className='size-full border-0 absolute top-0 left-0 z-20'
                title={__('Frontend Preview', 'suggerence-blocks')}
            />

            <div className='absolute bg-white z-10 top-0 left-0 size-full flex flex-col items-center justify-center text-block-generation-secondary!'>
                <div className='flex items-center gap-4'>
                    <Spinner className='size-8' />
                    <span className='text-2xl'>{__('Loading preview...', 'suggerence-blocks')}</span>
                </div>
            </div>
        </div>
    );
};