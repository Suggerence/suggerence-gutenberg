import { setProviderApiKey } from '@/shared/ai-providers/api'
import { toast } from 'sonner'

export const setProviderApiKeyMutationOptions = () => {
    return {
        mutationFn: ({ providerId, apiKey }: { providerId: string; apiKey: string }) => {
            return setProviderApiKey(providerId, apiKey)
        },
        onSuccess: (data: SetApiKeyResponse) => {
            toast.success(data.message);
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    }
}
