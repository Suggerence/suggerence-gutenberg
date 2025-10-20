export const noActionTool: SuggerenceMCPResponseTool = {
    name: 'no_action',
    description: 'Call this tool when you have completed all tasks and are waiting for user input, or when there is nothing left to do for the current request. This signals that the conversation turn is complete and allows you to send multiple messages to the user before calling this tool. Use this instead of just sending a text response when you want to provide updates or explanations across multiple messages.',
    inputSchema: {
        type: 'object',
        properties: {
            reason: {
                type: 'string',
                description: 'Brief explanation of why no action is needed (e.g., "All tasks completed", "Waiting for user input", "Request fully satisfied")',
                required: true
            },
            summary: {
                type: 'string',
                description: 'Optional summary of what was accomplished in this conversation turn'
            }
        },
        required: ['reason']
    }
};

export async function handleNoAction(args: { reason: string; summary?: string }): Promise<{ content: Array<{ type: string; text: string }> }> {
    return {
        content: [{
            type: 'text',
            text: JSON.stringify({
                success: true,
                action: 'no_action',
                message: `No action taken. Reason: ${args.reason}${args.summary ? ` | Summary: ${args.summary}` : ''}`
            })
        }]
    };
}
