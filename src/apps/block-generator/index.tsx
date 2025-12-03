import { __ } from '@wordpress/i18n';

import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

// @ts-ignore
import { PinnedItems } from '@wordpress/interface';

import { WebsocketHandler } from '@/apps/block-generator/components/WebsocketHandler';
import { BlockInserter } from '@/apps/block-generator/components/BlockInserter';
import { Main } from '@/apps/block-generator/components/Main';

import '@/apps/block-generator/style.scss';

const queryClient = new QueryClient();

const persister = createAsyncStoragePersister({
    storage: window.localStorage,
});

export const BlockGenerator = () =>
{
    return (
        <PinnedItems scope="core">
            <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
                <WebsocketHandler />
                <BlockInserter />

                <Main />
            </PersistQueryClientProvider>
        </PinnedItems>
    );
}