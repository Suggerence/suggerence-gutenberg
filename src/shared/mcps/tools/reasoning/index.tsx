export const thinkTool: SuggerenceMCPResponseTool = {
    name: 'think',
    description: 'Use this tool for MID-EXECUTION reasoning when things go wrong or become unclear. DO NOT use at task start (extended thinking handles initial planning). Call this when: a tool call FAILS (analyze error and plan recovery), results are UNEXPECTED (reconsider approach), you are UNSURE how to proceed (reason through options), or you need to REVISE your plan (something did not work as expected). This is for internal error recovery and adaptation - the user cannot see your thinking.',
    inputSchema: {
        type: 'object',
        properties: {
            thinking: {
                type: 'string',
                description: 'Your internal reasoning about the problem: What went wrong? What does the error/result mean? What alternative approaches can I try? How should I adjust my plan? What should I do next? Be thorough and analytical.'
            }
        },
        required: ['thinking']
    }
};

export function think(_thinking: string): { content: Array<{ type: string, text: string }> } {
    // The think tool allows the AI to reason through problems internally
    // This is invisible to the user - it's purely for the AI's planning and error recovery
    // The thinking parameter is processed by Claude but we don't need to do anything with it
    // Return a minimal acknowledgment
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'thinking_complete',
                    message: 'Internal reasoning processed. Continuing with execution.'
                })
            }
        ]
    };
}
