import { __ } from '@wordpress/i18n';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from '@wordpress/element';
import { getToolDisplayName } from '@/shared/utils/tool-names';
import {
    Confirmation,
    ConfirmationTitle,
    ConfirmationRequest,
    ConfirmationActions,
    ConfirmationAction,
} from '@/components/ai-elements/confirmation';

interface ToolConfirmationMessageProps {
    message: MCPClientMessage;
    onAccept: () => void;
    onReject: () => void;
}

export const ToolConfirmationMessage = ({
    message,
    onAccept,
    onReject
}: ToolConfirmationMessageProps) => {
    const [isArgsExpanded, setIsArgsExpanded] = useState(false);

    const cleanToolName = getToolDisplayName(message.toolName || '');

    return (
        <Confirmation
            state="approval-requested"
            approval={{
                approved: undefined,
                message: cleanToolName,
            }}
            className="border-yellow-500/50 dark:border-yellow-600/50 bg-yellow-50 dark:bg-yellow-950/20"
        >
            <ConfirmationRequest>
                <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-2">
                        <ConfirmationTitle className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                            {cleanToolName}
                        </ConfirmationTitle>

                        {message.toolArgs && Object.keys(message.toolArgs).length > 0 && (
                            <div className="space-y-1 w-full">
                                <button
                                    onClick={() => setIsArgsExpanded(!isArgsExpanded)}
                                    className="flex items-center gap-1 text-xs font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 transition-colors"
                                >
                                    {isArgsExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    ) : (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    )}
                                    {__('Arguments', 'suggerence')} ({Object.keys(message.toolArgs).length})
                                </button>

                                {isArgsExpanded && (
                                    <pre className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md p-2 text-[11px] font-mono text-yellow-900 dark:text-yellow-100 max-h-32 overflow-y-auto whitespace-pre-wrap break-words">
                                        {JSON.stringify(message.toolArgs, null, 2)}
                                    </pre>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <ConfirmationActions>
                    <ConfirmationAction
                        variant="outline"
                        onClick={onReject}
                    >
                        {__('Reject', 'suggerence')}
                    </ConfirmationAction>
                    <ConfirmationAction
                        onClick={onAccept}
                    >
                        {__('Allow', 'suggerence')}
                    </ConfirmationAction>
                </ConfirmationActions>
            </ConfirmationRequest>
        </Confirmation>
    );
};
