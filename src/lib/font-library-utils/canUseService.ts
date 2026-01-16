const LOCAL_STORAGE_ITEM = 'wp-font-library-google-fonts-permission';

export const canUseService = () =>
{
    return window.localStorage.getItem(LOCAL_STORAGE_ITEM) === 'true';
}