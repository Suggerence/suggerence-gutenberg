import { __experimentalVStack as VStack, __experimentalText as Text, Panel, PanelBody, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { getToolDisplayName } from '@/shared/utils/tool-names';

export const ToolMessage = ({message}: {message: MCPClientMessage}) => {
    const isError = message.toolResult === 'error';
    const isLoading = message.loading;
    const toolDisplayName = getToolDisplayName(message.toolName || '');
    
    // Check if tool result has success: false
    let parsedResult = null;
    let isToolFailure = false;
    
    if (message.toolResult && typeof message.toolResult === 'string') {
        try {
            parsedResult = JSON.parse(message.toolResult);
            isToolFailure = parsedResult && parsedResult.success === false;
        } catch (e) {
            // If parsing fails, treat as regular string result
        }
    } else if (message.toolResult && typeof message.toolResult === 'object') {
        isToolFailure = message.toolResult.success === false;
    }

    const messageDate = new Date(message.date);
    const timeString = messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return (
        <div style={{ width: '100%' }}>
            <VStack spacing={1} justify="start" style={{ overflowWrap: 'anywhere' }}>
                <Panel header="">
                    <Fragment key=".0">
                        <PanelBody
                            title={
                                isLoading ? (
                                    `Executing ${toolDisplayName}`
                                ) : isError || isToolFailure ? (
                                    `❌ ${toolDisplayName}`
                                ) : (
                                    `✅ ${toolDisplayName}`
                                )
                            }
                            initialOpen={false}
                        >
                            <PanelRow>
                                <VStack spacing={3}>
                                    {/* Tool Arguments */}
                                    <div>
                                        <Text size="12" weight="600" style={{ color: '#666', marginBottom: '4px' }}>
                                            {__("Arguments:", "suggerence")}
                                        </Text>
                                        <div
                                            style={{
                                                backgroundColor: '#f8f9fa',
                                                border: '1px solid #e9ecef',
                                                borderRadius: '4px',
                                                padding: '8px',
                                                fontSize: '11px',
                                                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                                whiteSpace: 'pre-wrap',
                                                overflow: 'auto',
                                                maxHeight: '150px'
                                            }}
                                        >
                                            {JSON.stringify(message.toolArgs, null, 2)}
                                        </div>
                                    </div>

                                    {/* Tool Result */}
                                    {!isLoading && (
                                        <div>
                                            <Text size="12" weight="600" style={{ color: '#666', marginBottom: '4px' }}>
                                                {isError || isToolFailure ? __("Error:", "suggerence") : __("Result:", "suggerence")}
                                            </Text>
                                            <div
                                                style={{
                                                    backgroundColor: isError || isToolFailure ? '#f8f9fa' : '#f0f8ff',
                                                    border: `1px solid ${isError || isToolFailure ? '#f44336' : '#2196f3'}`,
                                                    borderRadius: '4px',
                                                    padding: '8px',
                                                    fontSize: '11px',
                                                    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                                    whiteSpace: 'pre-wrap',
                                                    overflow: 'auto',
                                                    maxHeight: '200px',
                                                    color: isError || isToolFailure ? '#d32f2f' : '#1976d2'
                                                }}
                                            >
                                                {parsedResult ? JSON.stringify(parsedResult, null, 2) : (typeof message.toolResult === 'string' ? message.toolResult : JSON.stringify(message.toolResult, null, 2))}
                                            </div>
                                        </div>
                                    )}
                                </VStack>
                            </PanelRow>
                        </PanelBody>
                    </Fragment>
                </Panel>

                <Text variant="muted" size="11">
                    {timeString}
                </Text>
            </VStack>
        </div>
    );
};