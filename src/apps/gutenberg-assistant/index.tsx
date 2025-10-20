import { PluginSidebar, PluginSidebarMoreMenuItem } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { ChatInterface } from '@/apps/gutenberg-assistant/components/ChatInterface';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { useDispatch } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { WebSocketProvider } from '@/shared/context/WebSocketContext';

import './style.scss';

/**
 * Query Client
 */

const queryClient = new QueryClient()

const persister = createAsyncStoragePersister({
    storage: window.localStorage,
})


export const GutenbergAssistant = () => {

    const { openGeneralSidebar } = useDispatch('core/edit-post');

    domReady(() => {
        openGeneralSidebar('suggerence-gutenberg-assistant/suggerence-chat-sidebar');
    });

    return (
        <>
            <PluginSidebarMoreMenuItem
                target="suggerence-chat-sidebar"
            >
                {__("Suggerence Chat", "suggerence")}
            </PluginSidebarMoreMenuItem>

            <PluginSidebar
                name="suggerence-chat-sidebar"
                title={__("Suggerence Chat", "suggerence")}
            >
                <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
                    <WebSocketProvider>
                        <ChatInterface />
                    </WebSocketProvider>
                </PersistQueryClientProvider>
            </PluginSidebar>
        </>
    );
};