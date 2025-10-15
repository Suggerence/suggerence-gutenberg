import { Children } from '@wordpress/element';

interface AssistantMessageGroupProps {
    children: React.ReactNode;
}

export const AssistantMessageGroup = ({ children }: AssistantMessageGroupProps) => {
    const childArray = Children.toArray(children);
    const messageCount = childArray.length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {childArray.map((child, index) => {
                const isLast = index === messageCount - 1;

                return (
                    <div key={index}>
                        {/* Message content - the message itself contains its icon */}
                        <div style={{ paddingBottom: '4px' }}>
                            {child}
                        </div>

                        {/* Connecting line to next message */}
                        {!isLast && (
                            <div
                                style={{
                                    width: '2px',
                                    height: '12px',
                                    backgroundColor: '#cbd5e1',
                                    marginLeft: '7px',
                                    marginTop: '4px',
                                    marginBottom: '4px'
                                }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
