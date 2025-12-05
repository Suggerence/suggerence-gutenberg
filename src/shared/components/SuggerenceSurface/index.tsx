import type { PropsWithChildren } from 'react';
import clsx from 'clsx';

interface SuggerenceSurfaceProps extends PropsWithChildren {
    className?: string;
}

export const SuggerenceSurface = ({ children, className }: SuggerenceSurfaceProps) => {
    return (
        <div className={clsx('suggerence-app', className)}>
            {children}
        </div>
    );
};
