import { create } from 'zustand';
import type { ScreenshotCaptureResult, ScreenshotToolOptions, ScreenshotViewportPreset } from '@/apps/gutenberg-assistant/components/ScreenshotCapture/types';

type ScreenshotMode = 'manual' | 'tool';

interface ScreenshotToolRequest {
    id: string;
    options: ScreenshotToolOptions;
    resolve: (result: ScreenshotCaptureResult) => void;
    reject: (error: Error) => void;
}

interface ScreenshotCaptureState {
    isOpen: boolean;
    mode: ScreenshotMode;
    devicePreset: ScreenshotViewportPreset;
    fullHeight: boolean;
    requestedUrl: string | null;
    pendingRequest: ScreenshotToolRequest | null;
    openManual: () => void;
    close: () => void;
    setDevicePreset: (preset: ScreenshotViewportPreset) => void;
    setFullHeight: (value: boolean) => void;
    startToolCapture: (options: ScreenshotToolOptions) => Promise<ScreenshotCaptureResult>;
    resolveToolCapture: (result: ScreenshotCaptureResult) => void;
    rejectToolCapture: (message: string) => void;
}

export const useScreenshotCaptureStore = create<ScreenshotCaptureState>((set, get) => ({
    isOpen: false,
    mode: 'manual',
    devicePreset: 'desktop',
    fullHeight: true,
    requestedUrl: null,
    pendingRequest: null,

    openManual: () => {
        set({
            isOpen: true,
            mode: 'manual',
            requestedUrl: null,
            pendingRequest: null
        });
    },

    close: () => {
        const pending = get().pendingRequest;
        if (pending) {
            pending.reject(new Error('Screenshot capture cancelled by user'));
        }
        set({
            isOpen: false,
            mode: 'manual',
            requestedUrl: null,
            pendingRequest: null
        });
    },

    setDevicePreset: (preset) => set({ devicePreset: preset }),

    setFullHeight: (value) => set({ fullHeight: value }),

    startToolCapture: (options) => {
        const preset = options.device || get().devicePreset;
        const requestId = `screenshot-tool-${Date.now()}`;

        return new Promise((resolve, reject) => {
            set({
                isOpen: true,
                mode: 'tool',
                devicePreset: preset,
                fullHeight: options.fullHeight ?? true,
                requestedUrl: options.url || null,
                pendingRequest: {
                    id: requestId,
                    options,
                    resolve,
                    reject
                }
            });
        });
    },

    resolveToolCapture: (result) => {
        const pending = get().pendingRequest;
        if (pending) {
            pending.resolve(result);
        }
        set({
            pendingRequest: null,
            isOpen: false,
            mode: 'manual',
            requestedUrl: null
        });
    },

    rejectToolCapture: (message) => {
        const pending = get().pendingRequest;
        if (pending) {
            pending.reject(new Error(message));
        }
        set({
            pendingRequest: null,
            isOpen: false,
            mode: 'manual',
            requestedUrl: null
        });
    }
}));
