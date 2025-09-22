import { createElement } from '@wordpress/element';

export const Heading = ({ children, className, size = 'lg', as = 'h1' }: { children: React.ReactNode, className?: string, size?: 'sm' | 'md' | 'lg', as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' }) => {
    return (
        createElement(as, { className: `!text-2xl !font-[600] !mt-0 !py-0 !font-medium ${className} ${size === 'sm' ? '!text-lg' : size === 'md' ? '!text-xl' : '!text-2xl'}`, children: children })
    )
}