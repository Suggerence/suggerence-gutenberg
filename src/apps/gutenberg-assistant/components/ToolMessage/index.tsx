import { __ } from '@wordpress/i18n';
import { getToolDisplayName } from '@/shared/utils/tool-names';
import {
    Tool,
    ToolHeader,
    ToolContent,
    ToolInput,
    ToolOutput,
} from '@/components/ai-elements/tool';
import type { ToolUIPart } from 'ai';

export const ToolMessage = ({message}: {message: MCPClientMessage}) => {
    const isError = message.toolResult === 'error';
    const isLoading = message.loading;
    const toolDisplayName = getToolDisplayName(message.toolName || '');

    // Check if tool was stopped by user
    const isStopped = message.content === 'Stopped by user' || message.toolResult === 'Stopped by user';

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

    const hasError = isError || isToolFailure;

    // Determine state for the Tool component
    let state: ToolUIPart['state'] = 'output-available';
    if (isLoading) {
        state = 'input-available';
    } else if (hasError) {
        state = 'output-error';
    }

    console.log('=== ToolMessage Debug ===');
    console.log('toolDisplayName:', toolDisplayName);
    console.log('message.toolName:', message.toolName);
    console.log('message.toolArgs:', message.toolArgs);
    console.log('message.toolResult:', message.toolResult);
    console.log('state:', state);
    console.log('isLoading:', isLoading);
    console.log('hasError:', hasError);
    console.log('parsedResult:', parsedResult);
    console.log('========================');

    return (
        <div className="w-full mb-4">
            <Tool defaultOpen={false}>
                <ToolHeader
                    title={toolDisplayName || 'Tool Call'}
                    type={`tool-call`}
                    state={state}
                />
                <ToolContent>
                    {message.toolArgs && (
                        <>
                            {console.log('Rendering ToolInput with:', message.toolArgs)}
                            <ToolInput input={message.toolArgs} />
                        </>
                    )}
                    {!isLoading && message.toolResult !== undefined && (
                        <>
                            {console.log('Rendering ToolOutput with:', parsedResult || message.toolResult)}
                            <ToolOutput
                                output={parsedResult || message.toolResult}
                                errorText={hasError ? (isStopped ? __('Stopped by user', 'suggerence') : __('Error occurred', 'suggerence')) : undefined}
                            />
                        </>
                    )}
                </ToolContent>
            </Tool>
        </div>
    );
};