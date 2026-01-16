import { __ } from '@wordpress/i18n';
import type { LucideIcon } from 'lucide-react';
import { 
    Edit, 
    List, 
    Search, 
    Download, 
    FolderOpen, 
    FileText,
    CheckCircle2,
    XCircle,
    Loader2
} from 'lucide-react';

export interface FormattedToolMessage {
    message: string;
    icon: LucideIcon;
}

/**
 * Formats a tool name and arguments into a user-friendly message
 * @param toolName The technical tool name (e.g., "edit_style")
 * @param args The tool arguments
 * @returns A formatted message with icon
 */
export function formatToolMessage(
    toolName: string,
    args: Record<string, unknown>
): FormattedToolMessage {
    // Remove server prefix if present
    const cleanToolName = toolName?.replace(/^[^_]*___/, '') || toolName;

    switch (cleanToolName) {
        case 'edit_style': {
            const path = args.path as string;
            const value = args.value as string;
            const block = args.block as string | undefined;
            
            // Convert dot notation to readable format
            const readablePath = path ? path.split('.').join(' → ') : '';
            const readableValue = value || '';
            
            let message = String(__('Edited style', 'suggerence'));
            if (readablePath) {
                message += ` ${readablePath}`;
            }
            if (readableValue) {
                message += ` to "${readableValue}"`;
            }
            if (block) {
                message += ` (${block})`;
            }
            
            return {
                message,
                icon: Edit
            };
        }

        case 'list_styles':
            return {
                message: String(__('Listed available styles', 'suggerence')),
                icon: List
            };

        case 'read_style': {
            const path = args.path as string;
            const readablePath = path ? path.split('.').join(' → ') : '';
            return {
                message: readablePath 
                    ? String(__('Read style', 'suggerence')) + ` ${readablePath}`
                    : String(__('Read style', 'suggerence')),
                icon: FileText
            };
        }

        case 'search_styles': {
            const query = args.query as string;
            return {
                message: query
                    ? String(__('Searched styles for', 'suggerence')) + ` "${query}"`
                    : String(__('Searched styles', 'suggerence')),
                icon: Search
            };
        }

        case 'search_fonts': {
            const query = args.query as string;
            return {
                message: query
                    ? String(__('Searched fonts for', 'suggerence')) + ` "${query}"`
                    : String(__('Searched fonts', 'suggerence')),
                icon: Search
            };
        }

        case 'install_font': {
            const slug = args.slug as string;
            return {
                message: slug
                    ? String(__('Installed font', 'suggerence')) + ` "${slug}"`
                    : String(__('Installed font', 'suggerence')),
                icon: Download
            };
        }

        case 'navigate': {
            const path = args.path as string;
            return {
                message: path
                    ? String(__('Navigated to', 'suggerence')) + ` ${path}`
                    : String(__('Navigated', 'suggerence')),
                icon: FolderOpen
            };
        }

        case 'list_paths':
            return {
                message: String(__('Listed available paths', 'suggerence')),
                icon: List
            };

        // Fallback for unknown tools
        default:
            return {
                message: String(__('Executed tool', 'suggerence')) + ` ${cleanToolName}`,
                icon: FileText
            };
    }
}

/**
 * Gets the status icon for a tool execution
 */
export function getToolStatusIcon(status: 'pending' | 'success' | 'error') {
    switch (status) {
        case 'pending':
            return Loader2;
        case 'success':
            return CheckCircle2;
        case 'error':
            return XCircle;
        default:
            return Loader2;
    }
}
