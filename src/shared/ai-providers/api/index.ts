import apiFetch from "@wordpress/api-fetch";

declare const SuggerenceData: SuggerenceData;

export const getProviders = async (): Promise<AIProvider[]> => {
    apiFetch.use(apiFetch.createNonceMiddleware(SuggerenceData.nonce));

    return apiFetch({
        path: 'suggerence-gutenberg/ai-providers/v1/providers',
        method: 'GET',
    });
}

export const setProviderApiKey = async (providerId: string, apiKey: string): Promise<SetApiKeyResponse> => {
    apiFetch.use(apiFetch.createNonceMiddleware(SuggerenceData.nonce));

    return apiFetch({
        path: `suggerence-gutenberg/ai-providers/v1/providers/${providerId}/api-key`,
        method: 'POST',
        data: { api_key: apiKey },
    });
}