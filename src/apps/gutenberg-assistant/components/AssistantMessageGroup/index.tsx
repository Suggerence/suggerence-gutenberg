import { Children } from '@wordpress/element';

interface AssistantMessageGroupProps {
    children: React.ReactNode;
}

export const AssistantMessageGroup = ({ children }: AssistantMessageGroupProps) => {
    const childArray = Children.toArray(children);

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {childArray.map((child, index) => {
                return (
                    <div key={index}>
                        <div className="pb-4">
                            {child}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
