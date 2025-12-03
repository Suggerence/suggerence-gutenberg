import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ConfigurationStore
{
    theme: 'dark' | 'light';

    setTheme: (theme: 'dark' | 'light') => void;
}

export const useConfigurationStore = create<ConfigurationStore>()(
    persist(
        (set) => ({
            theme: 'dark',
            setTheme: (theme) => set({ theme }),
        }),
        { name: 'suggerence-blocks-configuration', storage: createJSONStorage(() => localStorage) }
    )
);