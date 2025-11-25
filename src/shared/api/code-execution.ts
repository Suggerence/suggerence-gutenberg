import { WEBSOCKET_CONFIG } from '@/shared/config/websocket';

const API_BASE_URL = 'http://localhost:3000/v1';

const buildUrl = (path: string, params: Record<string, string> = {}): string => {
    const base = API_BASE_URL.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${base}${normalizedPath}`);
    url.searchParams.set('api_key', WEBSOCKET_CONFIG.getApiKey());
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    return url.toString();
};

const defaultHeaders = {
    'Content-Type': 'application/json'
};

export interface CodeWorkspaceSessionResponse {
    session_id: string;
    created_at: string;
    last_active: string;
}

export interface WorkspaceFileEntry {
    name: string;
    isDirectory: boolean;
}

export const createCodeWorkspaceSession = async (sessionId?: string): Promise<CodeWorkspaceSessionResponse> => {
    const url = buildUrl('/code-workspace/sessions', sessionId ? { session_id: sessionId } : {});
    const response = await fetch(url, {
        method: 'POST',
        headers: defaultHeaders
    });

    if (!response.ok) {
        throw new Error('Failed to initialize code workspace');
    }

    return response.json();
};

export const syncWorkspaceContext = async (sessionId: string, key: string, data: unknown): Promise<void> => {
    const url = buildUrl(`/code-workspace/sessions/${sessionId}/context`);
    const response = await fetch(url, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({ key, data })
    });

    if (!response.ok) {
        throw new Error('Failed to sync workspace context');
    }
};

export const listWorkspaceFiles = async (sessionId: string, path: string = 'workspace'): Promise<WorkspaceFileEntry[]> => {
    const url = buildUrl(`/code-workspace/sessions/${sessionId}/files`, { path });
    const response = await fetch(url, {
        method: 'GET',
        headers: defaultHeaders
    });

    if (!response.ok) {
        throw new Error('Failed to list workspace files');
    }

    const payload = await response.json();
    return payload.files || [];
};

export const readWorkspaceFile = async (sessionId: string, path: string): Promise<string> => {
    const url = buildUrl(`/code-workspace/sessions/${sessionId}/files/content`, { path });
    const response = await fetch(url, {
        method: 'GET',
        headers: defaultHeaders
    });

    if (!response.ok) {
        throw new Error('Failed to read workspace file');
    }

    const payload = await response.json();
    return payload.content as string;
};

export const writeWorkspaceFile = async (sessionId: string, path: string, content: string): Promise<void> => {
    const url = buildUrl(`/code-workspace/sessions/${sessionId}/files`);
    const response = await fetch(url, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({ path, content })
    });

    if (!response.ok) {
        throw new Error('Failed to write workspace file');
    }
};

export const runWorkspaceScript = async (sessionId: string, params: { entry?: string; args?: string[]; timeout_ms?: number; source?: string }): Promise<any> => {
    const url = buildUrl(`/code-workspace/sessions/${sessionId}/run`);
    const bodyPayload: Record<string, unknown> = {
        entry: params.entry,
        args: params.args,
        timeout_ms: params.timeout_ms,
        source: params.source
    };

    Object.keys(bodyPayload).forEach((key) => {
        if (bodyPayload[key as keyof typeof bodyPayload] === undefined) {
            delete bodyPayload[key as keyof typeof bodyPayload];
        }
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(bodyPayload)
    });

    if (!response.ok) {
        throw new Error('Failed to run workspace script');
    }

    return response.json();
};
