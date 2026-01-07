/**
 * Truncates a string to a maximum number of lines
 * @param text - The text to truncate
 * @param maxLines - Maximum number of lines to keep
 * @param maxLineLength - Maximum characters per line (default: 100)
 * @returns The truncated text with an ellipsis indicator if truncated
 */
export function truncateToMaxLines(text: string, maxLines: number, maxLineLength: number = 100): string {
    if (!text) return text;
    
    const lines = text.split('\n');
    
    // Truncate individual lines that are too long
    const processedLines = lines.map(line => {
        if (line.length > maxLineLength) {
            return line.slice(0, maxLineLength) + '...';
        }
        return line;
    });
    
    if (processedLines.length <= maxLines) {
        return processedLines.join('\n');
    }
    
    const truncatedLines = processedLines.slice(0, maxLines);
    return truncatedLines.join('\n') + '\n... (truncated)';
}

/**
 * Truncates a JSON stringified object to a maximum number of lines
 * @param obj - The object to stringify and truncate
 * @param maxLines - Maximum number of lines to keep
 * @param indent - Number of spaces for indentation (default: 2)
 * @param maxLineLength - Maximum characters per line (default: 100)
 * @returns The truncated JSON string
 */
export function truncateJsonToMaxLines(
    obj: unknown,
    maxLines: number,
    indent: number = 2,
    maxLineLength: number = 100
): string {
    const jsonString = JSON.stringify(obj, null, indent);
    return truncateToMaxLines(jsonString, maxLines, maxLineLength);
}
