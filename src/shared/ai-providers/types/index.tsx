interface AIModel {
    id: string;
    name: string;
    provider: string;
    providerName: string;
    date: string;
    capabilities: string[];
}

interface AIProvider {
    id: string;
    name: string;
    description: string;
    website: string;
    configured: boolean;
    has_api_key: boolean;
    models: AIModel[];
}

interface SetApiKeyResponse {
    message: string;
    provider_id: string;
    configured: boolean;
}