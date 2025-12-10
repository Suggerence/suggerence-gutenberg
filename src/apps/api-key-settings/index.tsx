import { Button, Card, CardBody, Notice, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { getSuggerenceApiKeyStatus, removeSuggerenceApiKey, setSuggerenceApiKey } from '@/shared/settings/api';

import './style.scss';

type Status = { status: 'success' | 'error'; message: string } | null;

export const SuggerenceApiKeySettings = () => {
    const [configured, setConfigured] = useState(false);
    const [email, setEmail] = useState('');
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
                setEmail(response.email || '');
            } catch {
                setStatus({
                    status: 'error',
                    message: __('Unable to check credentials status.', 'suggerence-gutenberg'),
                });
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const clearStatus = () => setStatus(null);

    const handleSave = useCallback(async () => {
        if (!apiKey.trim() || !email.trim()) {
            return;
        }

        setIsSaving(true);
        clearStatus();

        try {
            const trimmedEmail = email.trim();
            await setSuggerenceApiKey(apiKey.trim(), trimmedEmail);
            setConfigured(true);
            setEmail(trimmedEmail);
            setApiKey('');
            setStatus({
                status: 'success',
                message: __('Suggerence credentials saved.', 'suggerence-gutenberg'),
            });
        } catch {
            setStatus({
                status: 'error',
                message: __('Unable to save credentials.', 'suggerence-gutenberg'),
            });
        } finally {
            setIsSaving(false);
        }
    }, [apiKey, email]);

    const handleRemove = useCallback(async () => {
        setIsRemoving(true);
        clearStatus();

        try {
            await removeSuggerenceApiKey();
            setConfigured(false);
            setEmail('');
            setStatus({
                status: 'success',
                message: __('Suggerence credentials removed.', 'suggerence-gutenberg'),
            });
        } catch {
            setStatus({
                status: 'error',
                message: __('Unable to remove credentials.', 'suggerence-gutenberg'),
            });
        } finally {
            setIsRemoving(false);
        }
    }, []);

    return (
        <section className="suggerence-api-key-settings">
            <Card>
                <CardBody>
                    <p>
                        {__('Enter the email associated with your Suggerence account and paste the API key you received from the portal.', 'suggerence-gutenberg')}
                    </p>
                    <TextControl
                        label={__('Email address', 'suggerence-gutenberg')}
                        placeholder={__('you@example.com', 'suggerence-gutenberg')}
                        value={email}
                        onChange={(value) => setEmail(value)}
                        type="email"
                    />
                    <TextControl
                        label={__('Suggerence API key', 'suggerence-gutenberg')}
                        placeholder={__('sk-sgg-...', 'suggerence-gutenberg')}
                        value={apiKey}
                        onChange={(value) => setApiKey(value)}
                        type="password"
                        help={
                            configured
                                ? __('Credentials are configured already.', 'suggerence-gutenberg')
                                : undefined
                        }
                    />

                    <div className="suggerence-api-key-settings__actions">
                        <Button
                            isPrimary
                            isBusy={isSaving}
                            onClick={handleSave}
                            disabled={!apiKey.trim() || !email.trim() || isSaving || isLoading}
                        >
                            {__('Save credentials', 'suggerence-gutenberg')}
                        </Button>
                        {configured && (
                            <Button
                                isSecondary
                                isBusy={isRemoving}
                                onClick={handleRemove}
                                disabled={isRemoving || isLoading}
                            >
                                {__('Remove credentials', 'suggerence-gutenberg')}
                            </Button>
                        )}
                    </div>

                    {isLoading && (
                        <Notice status="info" className="suggerence-api-key-settings__notice">
                            {__('Checking credentials status…', 'suggerence-gutenberg')}
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
