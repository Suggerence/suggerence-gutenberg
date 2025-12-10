import { requestAuthLogin, requestAuthRefresh, AuthTokensResponse } from '@/shared/api/authTokens';

type CachedTokens = {
    token: string;
    refreshToken: string;
    expiresAt: number;
    refreshExpiresAt: number;
};

const EXPIRY_BUFFER_MS = 30_000;
let cachedTokens: CachedTokens | null = null;
let inflightPromise: Promise<CachedTokens> | null = null;

export const getWebsocketAuthToken = async (): Promise<string> => {
    if (cachedTokens && isTokenValid(cachedTokens)) {
        return cachedTokens.token;
    }

    const tokens = await queueTokenRequest();
    return tokens.token;
};

export const clearWebsocketAuthToken = () => {
    cachedTokens = null;
};

const queueTokenRequest = (): Promise<CachedTokens> => {
    if (!inflightPromise) {
        const pending = issueTokens();
        inflightPromise = pending;

        pending.finally(() => {
            if (inflightPromise === pending) {
                inflightPromise = null;
            }
        });
    }

    return inflightPromise;
};

const issueTokens = async (): Promise<CachedTokens> => {
    if (cachedTokens && canRefresh(cachedTokens)) {
        try {
            const refreshed = await refreshTokens(cachedTokens.refreshToken);
            cachedTokens = refreshed;
            return refreshed;
        } catch (error) {
            cachedTokens = null;
        }
    }

    const fresh = await loginTokens();
    cachedTokens = fresh;
    return fresh;
};

const loginTokens = async (): Promise<CachedTokens> => {
    const response = await requestAuthLogin();
    return normalizeResponse(response);
};

const refreshTokens = async (refreshToken: string): Promise<CachedTokens> => {
    if (refreshToken.trim() === '') {
        throw new Error('Missing refresh token');
    }

    const response = await requestAuthRefresh(refreshToken);
    return normalizeResponse(response);
};

const normalizeResponse = (response: AuthTokensResponse): CachedTokens => {
    const token = (response.token ?? '').trim();
    const refreshToken = (response.refresh_token ?? '').trim();

    if (!token || !refreshToken) {
        throw new Error('Suggerence authentication response is incomplete');
    }

    return {
        token,
        refreshToken,
        expiresAt: parseExpiry(response.expires_at, response.expires_in),
        refreshExpiresAt: parseExpiry(response.refresh_expires_at),
    };
};

const parseExpiry = (isoValue?: string, fallbackSeconds?: number): number => {
    if (isoValue) {
        const parsed = Date.parse(isoValue);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }

    if (typeof fallbackSeconds === 'number' && Number.isFinite(fallbackSeconds)) {
        return Date.now() + fallbackSeconds * 1000;
    }

    return Date.now() + 60_000;
};

const isTokenValid = (tokens: CachedTokens): boolean => {
    return tokens.expiresAt - EXPIRY_BUFFER_MS > Date.now();
};

const canRefresh = (tokens: CachedTokens): boolean => {
    if (!tokens.refreshToken) {
        return false;
    }

    return tokens.refreshExpiresAt - EXPIRY_BUFFER_MS > Date.now();
};
