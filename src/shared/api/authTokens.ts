import apiFetch from '@wordpress/api-fetch';

declare const SuggerenceData: SuggerenceData;

let nonceAttached = false;
const ensureNonceMiddleware = () => {
    if (nonceAttached) {
        return;
    }

    apiFetch.use(apiFetch.createNonceMiddleware(SuggerenceData.nonce));
    nonceAttached = true;
};

export type AuthTokensResponse = {
    token: string;
    token_type?: string;
    expires_at?: string;
    expires_in?: number;
    refresh_token: string;
    refresh_expires_at?: string;
};

export const requestAuthLogin = async (): Promise<AuthTokensResponse> => {
    ensureNonceMiddleware();

    if (!SuggerenceData.auth_login_endpoint) {
        throw new Error('Suggerence login endpoint is not configured');
    }

    return apiFetch({
        path: SuggerenceData.auth_login_endpoint,
        method: 'POST',
    });
};

export const requestAuthRefresh = async (refreshToken: string): Promise<AuthTokensResponse> => {
    ensureNonceMiddleware();

    if (!SuggerenceData.auth_refresh_endpoint) {
        throw new Error('Suggerence refresh endpoint is not configured');
    }

    return apiFetch({
        path: SuggerenceData.auth_refresh_endpoint,
        method: 'POST',
        data: {
            refresh_token: refreshToken,
        },
    });
};
