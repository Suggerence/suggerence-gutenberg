import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useCallback } from '@wordpress/element';
import { ErrorInfo } from 'react';
import { nanoid } from 'nanoid';
import { Popover, SlotFillProvider } from '@wordpress/components';
import { BlockEditorProvider, BlockInspector } from '@wordpress/block-editor';

import { Spinner } from '@/components/ui/spinner';
import { useConversationsStore } from '@/apps/block-generator/stores/conversations';
import { useBlocksStore } from '@/apps/block-generator/stores/blocks';

import { BlockEditorPreviewEditorWindow } from '@/apps/block-generator/components/BlockEditor/Preview/Editor/Window';
import { ErrorBoundary } from '@/apps/block-generator/components/BlockEditor/Preview/Editor/ErrorBoundary';

import '@/apps/block-generator/components/BlockEditor/Preview/Editor/style.scss';

interface BlockEditorPreviewEditorProps {
    blocks: any[];
    isReady: boolean;
    onInput: (blocks: any[]) => void;
    onChange: (blocks: any[]) => void;
}

export const BlockEditorPreviewEditor = ({ blocks, isReady, onInput, onChange }: BlockEditorPreviewEditorProps) =>
{
    const { selectedBlockId } = useBlocksStore();
    const { addMessage } = useConversationsStore();
    const errorHandlersSetupRef = useRef(false);
    const currentBlockNameRef = useRef<string>('');
    const errorReportedRef = useRef<string>(''); // Track if we've already reported an error for this block

    // Update block name ref when blocks change and reset error reporting
    useEffect(() => {
        if (blocks.length > 0 && blocks[0].name) {
            const newBlockName = blocks[0].name;
            // Reset error reporting if block changed
            if (currentBlockNameRef.current !== newBlockName) {
                errorReportedRef.current = '';
            }
            currentBlockNameRef.current = newBlockName;
        }
    }, [blocks]);

    // Reset error reporting when selectedBlockId changes
    useEffect(() => {
        errorReportedRef.current = '';
    }, [selectedBlockId]);

    // Check if error originates from block's eval context
    const isBlockError = useCallback((stack?: string, componentStack?: string): boolean => {
        if (!stack && !componentStack) {
            return false;
        }

        const fullStack = [stack, componentStack].filter(Boolean).join('\n');
        
        // Check for development context: VMXXXX patterns (dynamically evaluated code)
        const hasVMContext = Boolean(fullStack.match(/VM\d+/));
        
        // Check for production context: block-generator.js (bundled code)
        const hasBlockGeneratorFile = fullStack.includes('block-generator.js');
        
        // Check for executeBlockRegistrationCode (indicates block eval context)
        // Note: In production builds, function names may be minified, so this might not always match
        const hasExecuteBlockRegistration = fullStack.includes('executeBlockRegistrationCode');
        
        // Check if error is related to current block component (suggerence/block-name)
        const hasBlockName = currentBlockNameRef.current && 
                            fullStack.includes(currentBlockNameRef.current);
        
        // Development mode: Check for VMXXXX patterns with eval context
        const hasDevelopmentEvalContext = hasVMContext && 
                                         (fullStack.includes('eval') || 
                                          hasExecuteBlockRegistration ||
                                          (fullStack.includes('at <anonymous>') && fullStack.includes('eval')));
        
        // Production mode: Check for block-generator.js with block-related context
        // In production, errors from eval'd block code will reference block-generator.js
        const hasProductionEvalContext = hasBlockGeneratorFile && 
                                        (hasExecuteBlockRegistration || 
                                         hasBlockName ||
                                         fullStack.includes('eval'));
        
        // Primary check: Stack trace contains evidence of block eval context
        // Works for both development (VMXXXX) and production (block-generator.js)
        const hasEvalContext = hasDevelopmentEvalContext || hasProductionEvalContext;
        
        // Secondary check: React component error during block rendering
        // In production, if it's a React block error from block-generator.js, it's likely from eval'd block code
        const isReactBlockError = componentStack && 
                                (componentStack.includes('BlockEdit') || 
                                 componentStack.includes('edit') ||
                                 componentStack.includes('BlockList')) &&
                                (hasVMContext || 
                                 hasProductionEvalContext ||
                                 (hasBlockGeneratorFile && (stack?.includes('eval') || hasBlockName)));
        
        // Only report if:
        // 1. It has eval context (most reliable - development or production)
        // 2. OR it's a React block error with eval context (development or production)
        // 3. OR it has block name AND eval context (double confirmation)
        return Boolean(hasEvalContext) || 
               Boolean(isReactBlockError) || 
               (Boolean(hasBlockName) && Boolean(hasEvalContext));
    }, []);

    const reportError = useCallback((errorType: string, message: string, stack?: string, componentStack?: string) => {
        // Only report errors that originate from block's eval context
        if (!isBlockError(stack, componentStack)) {
            return;
        }

        // Create a unique key for this block session
        const blockKey = selectedBlockId ?? '';
        
        // Skip if we've already reported an error for this block
        if (errorReportedRef.current === blockKey) {
            return;
        }

        // Mark that we've reported an error for this block
        errorReportedRef.current = blockKey;

        const errorData = {
            type: errorType,
            message: message,
            stack: stack,
            componentStack: componentStack,
            timestamp: Date.now(),
            context: 'editor-preview'
        };

        addMessage(selectedBlockId ?? '', {
            id: nanoid(),
            createdAt: new Date().toISOString(),
            type: 'suggestion',
            content: {
                description: `An error occurred in the block editor preview: ${message}`,
                type: 'error',
                data: errorData
            }
        });
    }, [selectedBlockId, addMessage, isBlockError]);

    const handleReactError = useCallback((error: Error, errorInfo: ErrorInfo) => {
        reportError('react-error', error.message, error.stack, errorInfo.componentStack ?? undefined);
    }, [reportError]);

    // Set up global error handlers
    useEffect(() => {
        if (errorHandlersSetupRef.current) return;
        errorHandlersSetupRef.current = true;

        // Store original console methods
        const originalConsole = {
            error: console.error,
            warn: console.warn
        };

        // Intercept console.error
        console.error = function(...args: Record<string, unknown>[]) {
            originalConsole.error.apply(console, args);
            
            const { message, stack } = args[0] as { message: string; stack: string };

            if (!message || !stack) return;
            
            reportError('console.error', message, stack);
        };

        // Intercept console.warn for potential errors
        console.warn = function(...args: Record<string, unknown>[]) {
            originalConsole.warn.apply(console, args);
            
            const { message, stack } = args[0] as { message: string; stack: string };

            if (!message || !stack) return;
            
            reportError('console.warn', message, stack);
        };

        // Handle unhandled errors
        const handleError = (event: ErrorEvent) => {
            const errorMessage = event.message || 'Unhandled error';
            const errorStack = event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`;
            reportError('unhandled-error', errorMessage, errorStack);
        };

        // Handle unhandled promise rejections
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason;
            const message = reason instanceof Error 
                ? reason.message 
                : String(reason);
            const stack = reason instanceof Error 
                ? reason.stack 
                : 'No stack trace available';
            reportError('unhandled-promise-rejection', message, stack);
        };

        window.addEventListener('error', handleError, true);
        window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

        // Handle errors from editor-canvas iframe if it exists
        const editorCanvas = document.querySelector('iframe[name="editor-canvas"]') as HTMLIFrameElement | null;
        if (editorCanvas && editorCanvas.contentWindow) {
            try {
                // Set up error handlers in the iframe's context
                editorCanvas.addEventListener('load', () => {
                    const iframeWindow = editorCanvas.contentWindow;
                    if (iframeWindow) {
                        iframeWindow.addEventListener('error', (event: ErrorEvent) => {
                            const errorMessage = event.message || 'Unhandled error in editor-canvas';
                            const errorStack = event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`;
                            reportError('iframe-error', errorMessage, errorStack);
                        }, true);

                        iframeWindow.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
                            const reason = event.reason;
                            const message = reason instanceof Error 
                                ? reason.message 
                                : String(reason);
                            const stack = reason instanceof Error 
                                ? reason.stack 
                                : 'No stack trace available';
                            reportError('iframe-promise-rejection', message, stack);
                        }, true);

                        // Intercept console methods in iframe
                        const iframeConsole = (iframeWindow as Window & { console: Console }).console;
                        const originalIframeConsole = {
                            error: iframeConsole.error,
                            warn: iframeConsole.warn
                        };

                        iframeConsole.error = function(...args: unknown[]) {
                            originalIframeConsole.error.apply(iframeConsole, args);
                            const message = args.map(arg => 
                                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                            ).join(' ');
                            if (message && !message.includes('[Deprecation]')) {
                                const stack = new Error().stack;
                                reportError('iframe-console.error', message, stack);
                            }
                        };

                        iframeConsole.warn = function(...args: unknown[]) {
                            originalIframeConsole.warn.apply(iframeConsole, args);
                            const message = args.map(arg => 
                                typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                            ).join(' ');
                            if (message && (message.includes('Error') || message.includes('not defined') || message.includes('undefined'))) {
                                const stack = new Error().stack;
                                reportError('iframe-console.warn', message, stack);
                            }
                        };
                    }
                });
            } catch (e) {
                // Cross-origin restrictions might prevent access
                console.log('Could not set up error handlers for editor-canvas iframe:', e);
            }
        }

        return () => {
            // Restore original console methods
            console.error = originalConsole.error;
            console.warn = originalConsole.warn;
            
            window.removeEventListener('error', handleError, true);
            window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
            
            // Reset ref so handlers can be set up again on remount
            errorHandlersSetupRef.current = false;
        };
    }, [reportError]);

    return (
        <SlotFillProvider>
            <BlockEditorProvider value={blocks} onInput={onInput} onChange={onChange} settings={{ hasFixedToolbar: false }}>
                <ErrorBoundary onError={handleReactError}>
                    {
                        isReady && blocks.length > 0 ? (
                            <div className='size-full flex'>
                                <BlockEditorPreviewEditorWindow blockClientId={blocks[0].clientId} />

                                <BlockInspector showNoBlockSelectedMessage={true} />
                            </div>
                        ) : (
                            <div className='size-full flex flex-col items-center justify-center'>
                                <div className='flex items-center gap-4'>
                                    <Spinner className='size-8' />
                                    <span className='text-2xl'>{__('Loading block...', 'suggerence-blocks')}</span>
                                </div>
                            </div>
                        )
                    }
                </ErrorBoundary>

                <Popover.Slot />
            </BlockEditorProvider>
        </SlotFillProvider>
    );
}