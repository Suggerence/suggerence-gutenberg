export const ProseContent = ({ content }: { content: string }) => {
    return (
        <div className="prose max-w-none prose-neutral prose-p:!mt-0 prose-p:!text-base prose-p:last:!mb-0" dangerouslySetInnerHTML={{ __html: content }}></div>
    );
};