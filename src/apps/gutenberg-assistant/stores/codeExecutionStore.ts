import { create } from 'zustand';
import type { SelectedContext } from '@/apps/gutenberg-assistant/stores/types';
import type { ScreenshotCaptureResult } from '@/apps/gutenberg-assistant/components/ScreenshotCapture/types';
import { createCodeWorkspaceSession, syncWorkspaceContext } from '@/shared/api/code-execution';

interface CodeExecutionState {
    sessionId?: string;
    ensureSession: () => Promise<string | undefined>;
    getSessionId: () => string | undefined;
    syncSelectedContexts: (contexts: SelectedContext[]) => Promise<void>;
    syncScreenshotResult: (result: ScreenshotCaptureResult) => Promise<void>;
}

const sanitizeScreenshot = (result: ScreenshotCaptureResult) => ({
    previewUrl: result.previewUrl,
    width: result.width,
    height: result.height,
    viewportWidth: result.viewportWidth,
    viewportHeight: result.viewportHeight,
    capturedAt: result.capturedAt
});

export const useCodeExecutionStore = create<CodeExecutionState>((set, get) => ({
    sessionId: undefined,

    ensureSession: async () => {
        const existingId = get().sessionId;
        if (existingId) {
            return existingId;
        }

        try {
            const session = await createCodeWorkspaceSession();
            set({ sessionId: session.session_id });
            return session.session_id;
        } catch (error) {
            console.error('Suggerence: Unable to initialize code workspace session', error);
            return undefined;
        }
    },

    getSessionId: () => get().sessionId,

    syncSelectedContexts: async (contexts: SelectedContext[]) => {
        const sessionId = await get().ensureSession();
        if (!sessionId) {
            return;
        }

        try {
            await syncWorkspaceContext(sessionId, 'selection', {
                contexts,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.warn('Suggerence: Failed to sync selected contexts', error);
        }
    },

    syncScreenshotResult: async (result: ScreenshotCaptureResult) => {
        const sessionId = await get().ensureSession();
        if (!sessionId) {
            return;
        }

        try {
            const sanitized = sanitizeScreenshot(result);
            const filename = `screenshot_${sanitized.capturedAt || Date.now()}`;
            await syncWorkspaceContext(sessionId, filename, sanitized);
        } catch (error) {
            console.warn('Suggerence: Failed to sync screenshot metadata', error);
        }
    }
}));
