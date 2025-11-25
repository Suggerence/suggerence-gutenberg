import { __ } from '@wordpress/i18n';
import { getToolDisplayName, getCleanToolName, isCodeExecutionTool } from '@/shared/utils/tool-names';
import {
    Tool,
    ToolHeader,
    ToolContent,
    ToolInput,
    ToolOutput,
} from '@/components/ai-elements/tool';
import type { ToolUIPart } from 'ai';
import { Badge } from '@/components/ui/badge';
import { CodeBlock } from '@/components/ai-elements/code-block';
import type { ReactNode } from 'react';

const WorkspaceLog = ({ label, value, variant = 'default' }: { label: string; value?: string; variant?: 'default' | 'error' }) => {
    if (!value) return null;
    return (
        <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
            <CodeBlock
                code={value}
                language="text"
                className={variant === 'error' ? 'bg-destructive/10 text-destructive border-destructive/30' : undefined}
            />
        </div>
    );
};

export const ToolMessage = ({message}: {message: MCPClientMessage}) => {
    let hasError = message.toolResult === 'error';
    const isLoading = message.loading;
    const toolDisplayName = getToolDisplayName(message.toolName || '');
    const cleanToolName = getCleanToolName(message.toolName || '');
    const isWorkspaceTool = isCodeExecutionTool(message.toolName || '');

    const isStopped = message.content === 'Stopped by user' || message.toolResult === 'Stopped by user';
    let parsedResult = null;
    let workspaceDetails: ReactNode = null;

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

    if (isWorkspaceTool && parsedResult && typeof parsedResult === 'object') {
        switch (cleanToolName) {
            case 'run_workspace_script': {
                const execution = parsedResult.result || {};
                workspaceDetails = (
                    <div className="space-y-3 border-b border-border/40 px-4 py-3 text-xs">
                        <div className="flex flex-wrap gap-4 text-muted-foreground">
                            <span>{__('Entry', 'suggerence')}: <strong className="text-foreground">{execution.entryFile || 'workspace/main.ts'}</strong></span>
                            {'exitCode' in execution && (
                                <span>{__('Exit code', 'suggerence')}: <strong className="text-foreground">{execution.exitCode ?? '—'}</strong></span>
                            )}
                            {'durationMs' in execution && (
                                <span>{__('Duration', 'suggerence')}: <strong className="text-foreground">{typeof execution.durationMs === 'number' ? `${execution.durationMs.toFixed(0)}ms` : '—'}</strong></span>
                            )}
                            {execution.timedOut && (
                                <span className="text-destructive font-semibold">{__('Timed out', 'suggerence')}</span>
                            )}
                        </div>
                        <WorkspaceLog label={__('Stdout', 'suggerence')} value={execution.stdout} />
                        <WorkspaceLog label={__('Stderr', 'suggerence')} value={execution.stderr} variant="error" />
                    </div>
                );
                break;
            }
            case 'read_workspace_file': {
                const content = typeof parsedResult.content === 'string' ? parsedResult.content : '';
                workspaceDetails = (
                    <div className="px-4 py-3 border-b border-border/40 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{__('File contents', 'suggerence')}</div>
                        <CodeBlock code={content} language="text" />
                    </div>
                );
                break;
            }
            case 'list_workspace_files': {
                const files = Array.isArray(parsedResult.files) ? parsedResult.files : [];
                workspaceDetails = (
                    <div className="px-4 py-3 border-b border-border/40 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{__('Workspace entries', 'suggerence')}</div>
                        <ul className="rounded-md border border-border/40 divide-y divide-border/40 text-sm">
                            {files.length === 0 && (
                                <li className="px-3 py-2 text-muted-foreground text-xs">{__('No files found in this path.', 'suggerence')}</li>
                            )}
                            {files.map((file: any, index: number) => (
                                <li key={`${file.name}-${index}`} className="px-3 py-1.5 flex items-center justify-between">
                                    <span className="font-mono text-xs">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">{file.isDirectory ? __('Folder', 'suggerence') : __('File', 'suggerence')}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
                break;
            }
            case 'write_workspace_file': {
                workspaceDetails = (
                    <div className="px-4 py-3 border-b border-border/40 text-xs text-muted-foreground">
                        {__('Wrote file to', 'suggerence')} <span className="font-mono text-foreground">{parsedResult.path}</span>
                    </div>
                );
                break;
            }
        }
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
                    {isWorkspaceTool && (
                        <div className="px-4 pt-4 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                            <Badge variant="outline" className="border-dashed border-primary/50 text-primary">{__('Workspace action', 'suggerence')}</Badge>
                            <span>{__('Executed inside secure workspace', 'suggerence')}</span>
                        </div>
                    )}
                    {workspaceDetails}
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
