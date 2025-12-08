import { Button, Card, CardBody, Notice, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { getSuggerenceApiKeyStatus, removeSuggerenceApiKey, setSuggerenceApiKey } from '@/shared/settings/api';

import './style.scss';

type Status = { status: 'success' | 'error'; message: string } | null;

export const SuggerenceApiKeySettings = () => {
    const [configured, setConfigured] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [status, setStatus] = useState<Status>(null);

    useEffect(() => {
        (async () => {
            try {
                const response = await getSuggerenceApiKeyStatus();
                setConfigured(response.configured);
            } catch {
                setStatus({
                    status: 'error',
                    message: __('Unable to check API key status.', 'suggerence-gutenberg'),
                });
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const clearStatus = () => setStatus(null);

    const handleSave = useCallback(async () => {
        if (!apiKey.trim()) {
            return;
        }

        setIsSaving(true);
        clearStatus();

        try {
            await setSuggerenceApiKey(apiKey.trim());
            setConfigured(true);
            setApiKey('');
            setStatus({
                status: 'success',
                message: __('Suggerence API key saved.', 'suggerence-gutenberg'),
            });
        } catch {
            setStatus({
                status: 'error',
                message: __('Unable to save API key.', 'suggerence-gutenberg'),
            });
        } finally {
            setIsSaving(false);
        }
    }, [apiKey]);

    const handleRemove = useCallback(async () => {
        setIsRemoving(true);
        clearStatus();

        try {
            await removeSuggerenceApiKey();
            setConfigured(false);
            setStatus({
                status: 'success',
                message: __('Suggerence API key removed.', 'suggerence-gutenberg'),
            });
        } catch {
            setStatus({
                status: 'error',
                message: __('Unable to remove API key.', 'suggerence-gutenberg'),
            });
        } finally {
            setIsRemoving(false);
        }
    }, []);

    return (
        <section className="suggerence-api-key-settings">
            <Card>
                <CardBody>
                    <p>{__('Paste the Suggerence API key you received from the portal.', 'suggerence-gutenberg')}</p>
                    <TextControl
                        label={__('Suggerence API key', 'suggerence-gutenberg')}
                        placeholder={__('sk-sgg-...', 'suggerence-gutenberg')}
                        value={apiKey}
                        onChange={(value) => setApiKey(value)}
                        type="password"
                        help={configured ? __('An API key is configured already.', 'suggerence-gutenberg') : undefined}
                    />

                    <div className="suggerence-api-key-settings__actions">
                        <Button
                            isPrimary
                            isBusy={isSaving}
                            onClick={handleSave}
                            disabled={!apiKey.trim() || isSaving || isLoading}
                        >
                            {__('Save API key', 'suggerence-gutenberg')}
                        </Button>
                        {configured && (
                            <Button
                                isSecondary
                                isBusy={isRemoving}
                                onClick={handleRemove}
                                disabled={isRemoving || isLoading}
                            >
                                {__('Remove API key', 'suggerence-gutenberg')}
                            </Button>
                        )}
                    </div>

                    {isLoading && (
                        <Notice status="info" className="suggerence-api-key-settings__notice">
                            {__('Checking API key status…', 'suggerence-gutenberg')}
                        </Notice>
                    )}

                    {status && (
                        <Notice status={status.status} className="suggerence-api-key-settings__notice">
                            {status.message}
                        </Notice>
                    )}
                </CardBody>
            </Card>
        </section>
    );
};
