import { GutenbergEditorMCPServer } from './sub-servers/GutenbergEditorMCPServer';
import { SEOExpertMCPServer } from './sub-servers/SEOExpertMCPServer';
import { ContentWriterMCPServer } from './sub-servers/ContentWriterMCPServer';
import { AccessibilityExpertMCPServer } from './sub-servers/AccessibilityExpertMCPServer';
import apiFetch from "@wordpress/api-fetch";

// Orchestrator-specific tools
export const routeToGutenbergTool: SuggerenceMCPResponseTool = {
    name: 'route_to_gutenberg',
    description: 'Routes requests to the Gutenberg Editor MCP for block manipulation, media management, and document operations.',
    inputSchema: {
        type: 'object',
        properties: {
            user_request: {
                type: 'string',
                description: 'The user request to send to the Gutenberg Editor MCP.',
                required: true
            }
        },
        required: ['user_request']
    }
};

export const routeToSEOExpertTool: SuggerenceMCPResponseTool = {
    name: 'route_to_seo_expert',
    description: 'Routes requests to the SEO Expert MCP for content optimization and search engine visibility.',
    inputSchema: {
        type: 'object',
        properties: {
            user_request: {
                type: 'string',
                description: 'The user request to send to the SEO Expert MCP.',
                required: true
            }
        },
        required: ['user_request']
    }
};

export const routeToContentWriterTool: SuggerenceMCPResponseTool = {
    name: 'route_to_content_writer',
    description: 'Routes requests to the Content Writer MCP for content improvement and writing quality enhancement.',
    inputSchema: {
        type: 'object',
        properties: {
            user_request: {
                type: 'string',
                description: 'The user request to send to the Content Writer MCP.',
                required: true
            }
        },
        required: ['user_request']
    }
};

export const routeToAccessibilityExpertTool: SuggerenceMCPResponseTool = {
    name: 'route_to_accessibility_expert',
    description: 'Routes requests to the Accessibility Expert MCP for content accessibility analysis and WCAG compliance.',
    inputSchema: {
        type: 'object',
        properties: {
            user_request: {
                type: 'string',
                description: 'The user request to send to the Accessibility Expert MCP.',
                required: true
            }
        },
        required: ['user_request']
    }
};

export class OrchestratorMCPServer {
    private subServers: Map<string, any> = new Map();
    private static isInitialized = false;
    
    static initialize(): SuggerenceMCPServerConnection {
        return {
            name: 'orchestrator',
            title: 'MCP Orchestrator',
            description: 'Main orchestrator that coordinates between specialized MCP servers',
            protocol_version: '1.0.0',
            endpoint_url: 'http://localhost:3000',
            is_active: true,
            type: 'server',
            connected: true,
            client: new OrchestratorMCPServer(),
            id: 0,
            capabilities: 'orchestration,coordination,multi-agent',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    }

    constructor() {
        // Initialize sub-servers
        this.subServers.set('gutenberg-editor', GutenbergEditorMCPServer.initialize());
        this.subServers.set('seo-expert', SEOExpertMCPServer.initialize());
        this.subServers.set('content-writer', ContentWriterMCPServer.initialize());
        this.subServers.set('accessibility-expert', AccessibilityExpertMCPServer.initialize());
    }

    // Registry functionality
    static getServer(serverName: string): SuggerenceMCPServerConnection | null {
        const serverMap: Record<string, any> = {
            'gutenberg-editor': GutenbergEditorMCPServer,
            'seo-expert': SEOExpertMCPServer,
            'content-writer': ContentWriterMCPServer,
            'accessibility-expert': AccessibilityExpertMCPServer
        };

        const serverClass = serverMap[serverName];
        if (!serverClass) {
            console.warn(`Unknown MCP server: ${serverName}`);
            return null;
        }

        try {
            return serverClass.initialize();
        } catch (error) {
            console.error(`Failed to initialize MCP server ${serverName}:`, error);
            return null;
        }
    }

    static getAllServers(): SuggerenceMCPServerConnection[] {
        const connections: SuggerenceMCPServerConnection[] = [];
        const serverMap: Record<string, any> = {
            'gutenberg-editor': GutenbergEditorMCPServer,
            'seo-expert': SEOExpertMCPServer,
            'content-writer': ContentWriterMCPServer,
            'accessibility-expert': AccessibilityExpertMCPServer
        };

        Object.entries(serverMap).forEach(([name, serverClass]) => {
            try {
                const connection = serverClass.initialize();
                connections.push(connection);
            } catch (error) {
                console.error(`Failed to initialize server ${name}:`, error);
            }
        });

        return connections;
    }

    static getAvailableServers(): string[] {
        return ['gutenberg-editor', 'seo-expert', 'content-writer', 'accessibility-expert'];
    }

    static isServerAvailable(serverName: string): boolean {
        return ['gutenberg-editor', 'seo-expert', 'content-writer', 'accessibility-expert'].includes(serverName);
    }

    listTools(): { tools: SuggerenceMCPResponseTool[] } {
        return {
            tools: [
                routeToGutenbergTool,
                routeToSEOExpertTool,
                routeToContentWriterTool,
                routeToAccessibilityExpertTool
            ]
        };
    }

    async callTool(params: { name: string, arguments: Record<string, any> }): Promise<{ content: Array<{ type: string, text: string }> }> {
        const { name, arguments: args } = params;

        try {
            switch (name) {
                case 'route_to_gutenberg':
                    return await this.routeToGutenberg(args.user_request);

                case 'route_to_seo_expert':
                    return await this.routeToSEOExpert(args.user_request);

                case 'route_to_content_writer':
                    return await this.routeToContentWriter(args.user_request);

                case 'route_to_accessibility_expert':
                    return await this.routeToAccessibilityExpert(args.user_request);

                default:
                    throw new Error(`Unknown orchestrator tool: ${name}`);
            }
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'orchestrator_execution_failed',
                        error: `Error in orchestrator: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        tool_name: name
                    })
                }]
            };
        }
    }

    // Method to handle agent switching from main agent
    async handleAgentSwitch(agentName: string, userRequest: string): Promise<{ content: Array<{ type: string, text: string }> }> {
        // Show redirecting message
        const redirectMessage = `🔄 Redirecting to ${this.getAgentDisplayName(agentName)}...`;
        
        // Get the appropriate agent configuration
        const systemPrompt = this.getSystemPromptForServer(agentName);
        const agentServer = this.subServers.get(agentName);
        const tools = agentServer?.client?.listTools()?.tools || [];
        
        // Get post context
        const context = await this.getPostContext();
        const prompt = context ? `${userRequest}\n\nContext: ${context}` : userRequest;
        
        // Make websocket call with the new agent's configuration
        const result = await this.callAIWithWebSocket(systemPrompt, prompt, tools);
        
        // Combine redirect message with agent response
        return {
            content: [
                {
                    type: 'text',
                    text: redirectMessage
                },
                ...result.content
            ]
        };
    }

    private getAgentDisplayName(agentName: string): string {
        switch (agentName) {
            case 'gutenberg-editor':
                return 'Gutenberg Editor';
            case 'seo-expert':
                return 'SEO Expert';
            case 'content-writer':
                return 'Content Writer';
            case 'accessibility-expert':
                return 'Accessibility Expert';
            default:
                return 'Specialized Agent';
        }
    }

    private async routeToGutenberg(userRequest: string): Promise<{ content: Array<{ type: string, text: string }> }> {
        return await this.handleAgentSwitch('gutenberg-editor', userRequest);
    }

    private async routeToSEOExpert(userRequest: string): Promise<{ content: Array<{ type: string, text: string }> }> {
        return await this.handleAgentSwitch('seo-expert', userRequest);
    }

    private async routeToContentWriter(userRequest: string): Promise<{ content: Array<{ type: string, text: string }> }> {
        return await this.handleAgentSwitch('content-writer', userRequest);
    }

    private async routeToAccessibilityExpert(userRequest: string): Promise<{ content: Array<{ type: string, text: string }> }> {
        return await this.handleAgentSwitch('accessibility-expert', userRequest);
    }

    private async callAIWithWebSocket(
        systemPrompt: string,
        prompt: string,
        tools: SuggerenceMCPResponseTool[]
    ): Promise<{ content: Array<{ type: string, text: string }> }> {
        try {
            // Get the websocket context from the global window object
            const websocketContext = (window as any).suggerenceWebSocketContext;
            
            if (!websocketContext || !websocketContext.isConnected) {
                throw new Error('WebSocket not connected');
            }

            // Create the request body for the websocket
            const requestBody = {
                messages: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }]
                    }
                ],
                system: [{ text: systemPrompt }],
                tools: tools || []
            };

            // Use the websocket to send the request
            return new Promise((resolve, reject) => {
                let accumulatedContent = '';
                let accumulatedThinking = '';
                let functionCalls: any[] = [];
                let isComplete = false;

                const handleMessage = (data: any) => {
                    if (isComplete) return;

                    switch (data.type) {
                        case 'content':
                            accumulatedContent = data.accumulated || accumulatedContent + data.content;
                            break;

                        case 'thinking':
                            accumulatedThinking = data.accumulated || accumulatedThinking + data.content;
                            break;

                        case 'function_calls':
                            functionCalls = data.functionCalls || [];
                            break;

                        case 'done':
                            isComplete = true;
                            // Just return the response - let the sub-agent handle its own tools
                            resolve({
                                content: [{
                                    type: 'text',
                                    text: accumulatedContent
                                }]
                            });
                            break;

                        case 'error':
                            isComplete = true;
                            reject(new Error(data.message || 'WebSocket error'));
                            break;

                        default:
                            console.warn('Unknown message type:', data.type);
                    }
                };

                // Send the request using the websocket context
                websocketContext.sendRequest(
                    {
                        type: 'generate',
                        data: requestBody
                    },
                    handleMessage,
                    () => {
                        // Cleanup on complete
                    }
                );
            });
        } catch (error) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        error: 'Failed to call AI via websocket',
                        message: error instanceof Error ? error.message : 'Unknown error'
                    })
                }]
            };
        }
    }


    private getSystemPromptForServer(serverName: string): string {
        switch (serverName) {
            case 'seo-expert':
                return `You are a specialized SEO expert. Analyze and optimize content for search engines based on user requests.

Your expertise includes:
- Keyword research and optimization
- Meta descriptions and title tags
- Content structure and readability
- Search engine ranking factors
- Local SEO and technical SEO

When a user asks for SEO help, provide:
1. Keyword optimization suggestions
2. Meta description recommendations
3. Title tag optimization
4. Content structure improvements
5. Internal linking opportunities
6. Technical SEO considerations
7. Local SEO opportunities (if applicable)

Always provide specific, actionable recommendations based on the user's request.`;

            case 'content-writer':
                return `You are a professional content writer specializing in creating engaging, high-quality content.

Your expertise includes:
- Writing style and tone adaptation
- Audience engagement techniques
- Content structure and flow
- Clarity and readability
- Emotional connection and persuasion

When a user asks for content help, provide:
1. Improved content with better flow and engagement
2. Style and tone adjustments
3. Audience-specific language recommendations
4. Structure and organization improvements
5. Call-to-action suggestions (if applicable)
6. Readability enhancements
7. Emotional appeal improvements

Always provide specific improvements and detailed explanations of the changes made.`;

            case 'accessibility-expert':
                return `You are a specialized accessibility expert focused on making content inclusive for all users.

Your expertise includes:
- WCAG 2.1 AA compliance
- Screen reader optimization
- Keyboard navigation
- Color contrast and visual accessibility
- Alternative text for images
- Heading structure and semantic HTML
- Focus management and ARIA labels

When a user asks for accessibility help, provide:
1. Current accessibility issues identified
2. Specific improvements needed
3. Alternative text suggestions (if applicable)
4. Heading structure recommendations
5. Color contrast considerations
6. Keyboard navigation improvements
7. Screen reader optimization
8. ARIA label suggestions
9. Semantic HTML recommendations
10. Focus management improvements

Always provide specific, actionable accessibility improvements based on the user's request.`;

            case 'gutenberg-editor':
                return `You are a Gutenberg editor expert specializing in WordPress block editing and content management.

Your expertise includes:
- Block manipulation and customization
- Media management and optimization
- Document structure and organization
- WordPress-specific features
- Content workflow optimization

When a user asks for Gutenberg help, provide:
1. Block-specific guidance and optimization
2. Media handling and organization
3. Document structure improvements
4. WordPress workflow enhancements
5. Content organization tips
6. Block customization suggestions

Always provide specific, actionable Gutenberg improvements based on the user's request.`;

            default:
                return `You are a helpful AI assistant. Provide assistance based on the user's request.`;
        }
    }

    // Get information about all available sub-servers
    getSubServers(): { servers: Array<{ name: string, title: string, description: string, capabilities: string }> } {
        const servers: Array<{ name: string, title: string, description: string, capabilities: string }> = [];
        
        this.subServers.forEach((server, name) => {
            servers.push({
                name: server.name,
                title: server.title,
                description: server.description,
                capabilities: server.capabilities
            });
        });

        return { servers };
    }

    // Check if a specific sub-server is available
    isServerAvailable(serverName: string): boolean {
        return this.subServers.has(serverName);
    }

    // Get tools from a specific sub-server
    getServerTools(serverName: string): { tools: SuggerenceMCPResponseTool[] } {
        const server = this.subServers.get(serverName);
        if (!server || !server.client) {
            return { tools: [] };
        }

        return server.client.listTools();
    }

    private async getPostContext(): Promise<string> {
        try {
            // Get current post information
            const postData = await apiFetch({
                path: '/wp/v2/posts',
                method: 'GET',
                data: {
                    per_page: 1,
                    status: 'draft,publish',
                    orderby: 'modified',
                    order: 'desc'
                }
            });

            if (!postData || !Array.isArray(postData) || postData.length === 0) {
                return '';
            }

            const post = postData[0];
            const blocks = post.blocks || [];

            return `Current Post Information:
- Title: ${post.title?.rendered || 'Untitled'}
- Status: ${post.status}
- Modified: ${post.modified}
- Blocks: ${blocks.length} blocks
- Content: ${post.content?.rendered || ''}`;

        } catch (error) {
            console.error('Failed to get post context:', error);
            return '';
        }
    }
}
