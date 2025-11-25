import { listWorkspaceFiles, readWorkspaceFile, writeWorkspaceFile, runWorkspaceScript } from '@/shared/api/code-execution';
import { useCodeExecutionStore } from '@/apps/gutenberg-assistant/stores/codeExecutionStore';

const listFilesTool: SuggerenceMCPResponseTool = {
    name: 'list_workspace_files',
    description: 'Lists files inside the code workspace. Use this to discover available scripts, context files, or generated assets.',
    inputSchema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Optional path relative to the workspace root.',
                default: 'workspace'
            }
        }
    }
};

const readFileTool: SuggerenceMCPResponseTool = {
    name: 'read_workspace_file',
    description: 'Reads a text file from the workspace and returns its contents. Use for inspecting scripts or generated artifacts.',
    inputSchema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Path to the file relative to the workspace root.',
                required: true
            }
        },
        required: ['path']
    }
};

const writeFileTool: SuggerenceMCPResponseTool = {
    name: 'write_workspace_file',
    description: 'Writes text content to a workspace file. Overwrites the file if it exists.',
    inputSchema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: 'Path relative to the workspace root.',
                required: true
            },
            content: {
                type: 'string',
                description: 'File contents to persist.',
                required: true
            }
        },
        required: ['path', 'content']
    }
};

const runScriptTool: SuggerenceMCPResponseTool = {
    name: 'run_workspace_script',
    description: 'Executes a TypeScript/JavaScript file inside the secure workspace sandbox and returns stdout/stderr.',
    inputSchema: {
        type: 'object',
        properties: {
            entry: {
                type: 'string',
                description: 'Path to the script relative to the workspace root.',
                default: 'workspace/main.ts'
            },
            args: {
                type: 'array',
                description: 'Command line arguments for the script.',
                items: {
                    type: 'string'
                }
            },
            timeout_ms: {
                type: 'number',
                description: 'Optional timeout in milliseconds (defaults to 60000).'
            },
            source: {
                type: 'string',
                description: 'Optional inline source to run without writing to disk separately.'
            }
        }
    }
};

const tools = [listFilesTool, readFileTool, writeFileTool, runScriptTool];

const ensureWorkspaceSession = async (): Promise<string> => {
    const store = useCodeExecutionStore.getState();
    const sessionId = await store.ensureSession();
    if (!sessionId) {
        throw new Error('Code execution workspace session is unavailable.');
    }
    return sessionId;
};

export class CodeExecutionMCPServer {
    static initialize(): SuggerenceMCPServerConnection {
        return {
            name: 'code_execution',
            title: 'Code Execution Workspace',
            description: 'Secure runtime for progressive code execution with workspace file access.',
            protocol_version: '1.0.0',
            endpoint_url: 'workspace://local',
            is_active: true,
            type: 'frontend',
            connected: true,
            client: new CodeExecutionMCPServer(),
            id: 2,
            capabilities: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    listTools(): { tools: SuggerenceMCPResponseTool[] } {
        return { tools };
    }

    async callTool(params: { name: string; arguments: Record<string, any> }): Promise<{ content: Array<{ type: string; text: string }> }> {
        const sessionId = await ensureWorkspaceSession();
        const { name, arguments: args } = params;

        try {
            switch (name) {
                case 'list_workspace_files': {
                    const entries = await listWorkspaceFiles(sessionId, typeof args.path === 'string' ? args.path : 'workspace');
                    return this.formatResponse({ success: true, files: entries });
                }
                case 'read_workspace_file': {
                    const path = String(args.path || '');
                    if (!path) throw new Error('Path is required');
                    const content = await readWorkspaceFile(sessionId, path);
                    return this.formatResponse({ success: true, path, content });
                }
                case 'write_workspace_file': {
                    const path = String(args.path || '');
                    const content = String(args.content || '');
                    if (!path) throw new Error('Path is required');
                    await writeWorkspaceFile(sessionId, path, content);
                    return this.formatResponse({ success: true, path });
                }
                case 'run_workspace_script': {
                    const result = await runWorkspaceScript(sessionId, {
                        entry: args.entry,
                        args: Array.isArray(args.args) ? args.args.map(String) : undefined,
                        timeout_ms: typeof args.timeout_ms === 'number' ? args.timeout_ms : undefined,
                        source: typeof args.source === 'string' ? args.source : undefined
                    });
                    return this.formatResponse({ success: true, result });
                }
                default:
                    throw new Error(`Unknown code workspace tool: ${name}`);
            }
        } catch (error) {
            return this.formatResponse({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                tool: name
            });
        }
    }

    private formatResponse(payload: Record<string, unknown>) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(payload, null, 2)
                }
            ]
        };
    }
}
