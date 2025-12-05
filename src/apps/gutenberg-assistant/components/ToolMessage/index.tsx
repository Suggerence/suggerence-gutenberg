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
    let hasError = message.toolResult === 'error';
    const isLoading = message.loading;
    const toolDisplayName = getToolDisplayName(message.toolName || '');

    const isStopped = message.content === 'Stopped by user' || message.toolResult === 'Stopped by user';
    let parsedResult = null;

    if (message.toolResult && typeof message.toolResult === 'string') {
        try {
            parsedResult = JSON.parse(message.toolResult);
            hasError = parsedResult && parsedResult.success === false;
        } catch (e) {
            hasError = true;
        }
    } else if (message.toolResult && typeof message.toolResult === 'object') {
        hasError = message.toolResult.success === false;
    }

    let state: ToolUIPart['state'] = 'output-available';
    if (isLoading) {
        state = 'input-available';
    } else if (hasError) {
        state = 'output-error';
    }

    return (
        <div className="w-full mb-4">
            <Tool defaultOpen={false}>
                <ToolHeader
                    title={toolDisplayName || 'Tool'}
                    type={`tool-call`}
                    state={state}
                />
                <ToolContent>
                    {message.toolArgs && (
                        <ToolInput input={message.toolArgs} />
                    )}
                    {!isLoading && message.toolResult !== undefined && (
                        <ToolOutput
                            output={parsedResult || message.toolResult}
                            errorText={hasError ? (isStopped ? __('Stopped by user', 'suggerence') : __('Error occurred', 'suggerence')) : undefined}
                        />
                    )}
                </ToolContent>
            </Tool>
        </div>
    );
};