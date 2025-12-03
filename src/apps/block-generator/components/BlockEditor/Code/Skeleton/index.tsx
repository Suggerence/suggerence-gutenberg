export const BlockEditorCodeSkeleton = () =>
{
    return (
        <div className="grow bg-block-generation-muted flex flex-col min-h-0 overflow-hidden">
            {/* Editor Header - Line numbers gutter */}
            <div className="flex h-full">
                
                {/* Line numbers area */}
                <div className="border-r border-block-generation-border p-4">
                    <div className="flex flex-col gap-6">
                        {[...Array(20)].map((_, index) => (
                            <div key={index} className="h-3 w-4 bg-block-generation-muted-foreground animate-pulse rounded" style={{ animationDelay: `${index * 0.05}s` }}></div>
                        ))}
                    </div>
                </div>

                {/* Code content area */}
                <div className="flex-1 p-4 overflow-hidden">
                    <div className="flex flex-col gap-6">
                        {/* Line 1 - Import statement */}
                        <div className="flex gap-2">
                            <div className="h-3 w-16 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-32 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-24 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-40 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                        </div>

                        {/* Line 2 - Import statement */}
                        <div className="flex gap-2" style={{ animationDelay: `0.05s` }}>
                            <div className="h-3 w-16 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-28 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-20 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-36 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                        </div>

                        {/* Line 3 - Empty line */}
                        <div className="h-3"></div>

                        {/* Line 4 - Function declaration */}
                        <div className="flex gap-2" style={{ animationDelay: `0.15s` }}>
                            <div className="h-3 w-20 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-24 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-8 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-12 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                        </div>

                        {/* Line 5 - Opening brace */}
                        <div className="h-3" style={{ animationDelay: `0.20s` }}>
                            <div className="h-3 w-4 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                        </div>

                        {/* Line 6 - Indented code */}
                        <div className="flex gap-2 pl-8" style={{ animationDelay: `0.25s` }}>
                            <div className="h-3 w-20 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-32 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-8 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-48 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                        </div>

                        {/* Line 7 - Indented code */}
                        <div className="flex gap-2 pl-8" style={{ animationDelay: `0.30s` }}>
                            <div className="h-3 w-16 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-24 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-6 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-28 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                        </div>

                        {/* Line 8 - Empty Line */}
                        <div className="h-3"></div>

                        {/* Line 9 - Indented code */}
                        <div className="flex gap-2 pl-8" style={{ animationDelay: `0.40s` }}>
                            <div className="h-3 w-18 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-40 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                        </div>

                        {/* Line 10 - Closing brace */}
                        <div className="h-3" style={{ animationDelay: `0.45s` }}>
                            <div className="h-3 w-4 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                        </div>

                        {/* Line 11 - Empty line */}
                        <div className="h-3"></div>

                        {/* Line 12 - Export statement */}
                        <div className="flex gap-2" style={{ animationDelay: `0.55s` }}>
                            <div className="h-3 w-20 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-28 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                            <div className="h-3 w-36 bg-block-generation-muted-foreground animate-pulse rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}