import apiFetch from '@wordpress/api-fetch';

declare const SuggerenceData: SuggerenceData;

const attachNonce = () => {
    apiFetch.use(apiFetch.createNonceMiddleware(SuggerenceData.nonce));
};

export type SuggerenceApiKeyStatusResponse = {
    configured: boolean;
    email: string;
};

export const getSuggerenceApiKeyStatus = async (): Promise<SuggerenceApiKeyStatusResponse> => {
    attachNonce();

    return apiFetch({
        path: SuggerenceData.api_key_endpoint,
        method: 'GET',
    });
};

export const setSuggerenceApiKey = async (apiKey: string, email: string): Promise<SuggerenceApiKeyStatusResponse> => {
    attachNonce();

    return apiFetch({
        path: SuggerenceData.api_key_endpoint,
        method: 'POST',
        data: { api_key: apiKey, email },
    });
};

export const removeSuggerenceApiKey = async (): Promise<SuggerenceApiKeyStatusResponse> => {
    attachNonce();

    return apiFetch({
        path: SuggerenceData.api_key_remove_endpoint,
        method: 'POST',
    });
};
