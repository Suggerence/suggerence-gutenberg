export type ScreenshotViewportPreset = 'desktop' | 'tablet' | 'mobile';

export interface ScreenshotCaptureResult {
    dataUrl: string;
    previewUrl: string;
    width: number;
    height: number;
    viewportWidth: number;
    viewportHeight: number;
    capturedAt: string;
}

export interface ScreenshotToolOptions {
    device?: ScreenshotViewportPreset;
    url?: string;
    fullHeight?: boolean;
}
