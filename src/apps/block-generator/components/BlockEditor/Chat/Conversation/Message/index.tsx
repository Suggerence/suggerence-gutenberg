import { __ } from '@wordpress/i18n';
import { CaseSensitive, ImageIcon, Braces, RotateCcw } from 'lucide-react';
import { Dashicon } from '@wordpress/components';

import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { ChainOfThought, ChainOfThoughtContent, ChainOfThoughtHeader, ChainOfThoughtImage, ChainOfThoughtSearchResult, ChainOfThoughtSearchResults, ChainOfThoughtStep } from '@/components/ai-elements/chain-of-thought';
import { Queue, QueueItem, QueueItemContent, QueueItemIndicator, QueueList, QueueSection, QueueSectionContent, QueueSectionLabel, QueueSectionTrigger, QueueItemDescription } from '@/components/ai-elements/queue'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning';
import { Button } from '@/components/ui/button';

import { useBlocksStore } from '@/apps/block-generator/stores/blocks';
import { useConversationsStore } from '@/apps/block-generator/stores/conversations';
import { useSendMessage } from '@/apps/block-generator/hooks/useSendMessage';

import { ToolCallMessage } from '@/apps/block-generator/components/BlockEditor/Chat/Conversation/Message/ToolCall';

import { cn } from '@/lib/utils';

interface BlockEditorChatConversationMessageProps
{
    message: Message;
}

export const TextMessage = ({ role, message }: { role: 'assistant' | 'user', message: TextMessage }) =>
{
    return (
        <Message from={role} className={role === 'assistant' ? 'max-w-none text-base!' : ''}>
            <MessageContent>
                <MessageResponse>
                    {message.content.text}
                </MessageResponse>
            </MessageContent>
        </Message>
    );
}

export const PlanningMessage = ({ message }: { message: PlanningMessage }) =>
{
    return (
        <ChainOfThought className='py-4' defaultOpen={message.content.attributes ? false : true}>
            <ChainOfThoughtHeader className='text-sm!'>
                {message.content.attributes ? __('Block planned', 'suggerence-blocks') : __('Planning block...', 'suggerence-blocks')}
            </ChainOfThoughtHeader>

            <ChainOfThoughtContent>
                {
                    message.content.title && (
                        <ChainOfThoughtStep icon={CaseSensitive} label={__('Block title generated', 'suggerence-blocks')} status='complete'>
                            <ChainOfThoughtSearchResults>
                                <ChainOfThoughtSearchResult>
                                    {message.content.title}
                                </ChainOfThoughtSearchResult>
                            </ChainOfThoughtSearchResults>
                        </ChainOfThoughtStep>
                    )
                }

                {
                    message.content.icon && (
                        <ChainOfThoughtStep icon={ImageIcon} label={__('Block icon selected', 'suggerence-blocks')} status='complete'>
                            <ChainOfThoughtImage caption={message.content.icon}>
                                <Dashicon icon={message.content.icon as any} size={48} />
                            </ChainOfThoughtImage>
                        </ChainOfThoughtStep>
                    )
                }

                {
                    message.content.block_reasoning && (
                        <ChainOfThoughtStep label={message.content.block_reasoning} status='complete' />
                    )
                }

                {
                    message.content.attributes && (
                        <ChainOfThoughtStep icon={Braces} label={__('Block attributes generated', 'suggerence-blocks')} status='complete'>
                            <ChainOfThoughtSearchResults className='flex-wrap'>
                                {(Object.keys(message.content.attributes ?? {})).map(key => (
                                    <ChainOfThoughtSearchResult key={key}>
                                        <span className='font-medium'>{key}</span>
                                    </ChainOfThoughtSearchResult>
                                ))}
                            </ChainOfThoughtSearchResults>
                        </ChainOfThoughtStep>
                    )
                }
            </ChainOfThoughtContent>
        </ChainOfThought>
    );
}

export const TodoMessage = ({ message }: { message: TodoMessage }) =>
{
    return (
        <Queue className='py-2'>
            <QueueSection>
                <QueueSectionTrigger>
                    <QueueSectionLabel count={message.content.tasks?.length ?? 0} label={__('Task list', 'suggerence-blocks')} />
                </QueueSectionTrigger>
                <QueueSectionContent>
                    <QueueList>
                        {
                            (message.content.tasks ?? []).map(task => (
                                <QueueItem key={task.title}>
                                    <div className='flex items-center gap-2'>
                                        <QueueItemIndicator completed={task.status === 'completed'} />
                                        <QueueItemContent completed={task.status === 'completed'}>
                                            {task.title}
                                        </QueueItemContent>

                                        {
                                            task.description && (
                                                <QueueItemDescription completed={task.status === 'completed'}>
                                                    {task.description}
                                                </QueueItemDescription>
                                            )
                                        }
                                    </div>
                                </QueueItem>
                            ))
                        }
                    </QueueList>
                </QueueSectionContent>
            </QueueSection>
        </Queue>
    );
}

export const ReasoningMessage = ({ message }: { message: ReasoningMessage }) =>
{
    return (
        <Reasoning className='w-full' isStreaming={message.content.streaming}>
            <ReasoningTrigger />
            <ReasoningContent>
                {message.content.text || __('Thinking...', 'suggerence-blocks')}
            </ReasoningContent>
        </Reasoning>
    );
}

export const ErrorMessage = ({ message }: { message: ErrorMessage }) =>
{
    const { selectedBlockId } = useBlocksStore();
    const { getConversation, deleteMessage } = useConversationsStore();
    const { sendMessage } = useSendMessage();

    const conversation = selectedBlockId ? getConversation(selectedBlockId) : null;
    const messageIndex = conversation?.messages.findIndex(m => m.id === message.id) ?? -1;

    // Find the last user message before this error message
    const lastUserMessage = conversation?.messages
        .slice(0, messageIndex)
        .reverse()
        .find(m => m.type === 'message') as TextMessage | undefined;

    const handleRetry = () =>
    {
        if (!selectedBlockId || messageIndex === -1) return;

        // Delete the error message
        deleteMessage(selectedBlockId, messageIndex);

        // Retry the last user message if available
        if (lastUserMessage?.content.text) {
            sendMessage(lastUserMessage.content.text);
        }
    };

    return (
        <div className='w-full'>
            <div className="rounded-lg border p-4 bg-destructive/10 dark:bg-destructive/5 border-destructive/30 dark:border-destructive/20 text-sm text-block-generation-primary">
                <p className='text-block-generation-primary m-0! mb-3!'>
                    {message.content.text}
                </p>
                {lastUserMessage && (
                    <Button
                        variant='ghost'
                        size='sm'
                        onClick={handleRetry}
                        className="cursor-pointer hover:bg-block-generation-primary/10!"
                    >
                        <RotateCcw className='size-4' />
                        {__('Retry', 'suggerence-blocks')}
                    </Button>
                )}
            </div>
        </div>
    );
}

export const BlockEditorChatConversationMessage = ({ message }: BlockEditorChatConversationMessageProps) =>
{
    switch (message.type) {
        case 'message':
            return <TextMessage role='user' message={message as TextMessage} />;

        case 'block_planning':
            return <PlanningMessage message={message as PlanningMessage} />;

        case 'todo':
            return <TodoMessage message={message as TodoMessage} />;

        case 'reasoning':
            return <ReasoningMessage message={message as ReasoningMessage} />;

        case 'response':
            return <TextMessage role='assistant' message={message as TextMessage} />;

        case 'tool_call':
            return <ToolCallMessage message={message as ToolCallMessage} />;

        case 'error':
            return <ErrorMessage message={message as ErrorMessage} />;
    }
}