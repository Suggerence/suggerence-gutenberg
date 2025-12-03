import { useState, useEffect } from '@wordpress/element';
import { Sun, Moon } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { cn } from '@/lib/utils';

import { useConfigurationStore } from '@/apps/block-generator/stores/configuration';

interface ThemeSwitchProps
{
    className?: string;
}

export const ThemeSwitch = ({ className }: ThemeSwitchProps) =>
{
    const { theme, setTheme } = useConfigurationStore();

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    return (
        <div className={cn('absolute top-4 right-16 z-10', className)}>
            <Tabs defaultValue={theme}>
                <TabsList>
                    <TabsTrigger value="light" onClick={() => setTheme('light')}><Sun className="size-4" /></TabsTrigger>
                    <TabsTrigger value="dark" onClick={() => setTheme('dark')}><Moon className="size-4" /></TabsTrigger>
                </TabsList>
            </Tabs>
        </div>
    );
}