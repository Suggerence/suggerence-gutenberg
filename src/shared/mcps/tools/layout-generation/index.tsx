import { createBlock, serialize } from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

type TemplateBlockDefinition = {
    block_type?: string;
    blockType?: string;
    name?: string;
    attributes?: Record<string, any>;
    style?: Record<string, any>;
    inner_blocks?: TemplateBlockDefinition[];
    innerBlocks?: TemplateBlockDefinition[];
};

type CreateTemplateArgs = {
    template_title?: string;
    template_slug?: string;
    template_description?: string;
    template_content?: string;
    template_blocks?: TemplateBlockDefinition[];
    apply_to_post?: boolean;
    overwrite_existing?: boolean;
    post_id?: number;
    post_type?: string;
};

type ListTemplatesArgs = {
    search?: string;
    status?: string;
    per_page?: number;
    page?: number;
};

type ApplyTemplateArgs = {
    template_slug: string;
    post_id?: number;
    post_type?: string;
};

export const createGutenbergTemplateTool: SuggerenceMCPResponseTool = {
    name: 'create_gutenberg_template',
    description: 'Creates or updates a Gutenberg block template for the active theme and applies it to the current post/page. Use this when the default theme template is not suitable (e.g., landing pages) and you need to define a custom layout. Provide either serialized block content (template_content) or structured blocks (template_blocks) to build the template.',
    inputSchema: {
        type: 'object',
        properties: {
            template_title: {
                type: 'string',
                description: 'Human-readable name for the template. Used as the template title in WordPress. If template_slug is missing, a slug will be derived from this.'
            },
            template_slug: {
                type: 'string',
                description: 'Unique slug for the template (without theme prefix). If omitted, a sanitized slug will be generated from template_title.'
            },
            template_description: {
                type: 'string',
                description: 'Optional description to document when and how this template should be used.'
            },
            template_content: {
                type: 'string',
                description: 'Serialized block markup for the template (what wp/v2/templates expects). Provide this OR template_blocks.'
            },
            template_blocks: {
                type: 'array',
                description: 'Structured block definitions that will be serialized automatically. Each item looks like { block_type: "core/group", attributes: {...}, inner_blocks: [...] }',
                items: {
                    type: 'object'
                }
            },
            overwrite_existing: {
                type: 'boolean',
                description: 'If true (default), update an existing template with the same slug; if false, fail when the template already exists.',
                default: true
            },
            apply_to_post: {
                type: 'boolean',
                description: 'Whether to assign the created/updated template to the current post/page. Defaults to true.',
                default: true
            },
            post_id: {
                type: 'number',
                description: 'Optional explicit post/page ID to assign the template to (defaults to the post currently open in the editor).'
            },
            post_type: {
                type: 'string',
                description: 'Optional post type slug for post_id (e.g., "page", "post"). Defaults to the current post type.'
            }
        },
        required: ['template_title']
    }
};

export const listGutenbergTemplatesTool: SuggerenceMCPResponseTool = {
    name: 'list_gutenberg_templates',
    description: 'Lists available block templates for the active theme so you can reuse an existing template instead of creating a new one. Returns slug (value to assign on posts), title, description, and status.',
    inputSchema: {
        type: 'object',
        properties: {
            search: {
                type: 'string',
                description: 'Optional search string to filter templates by title/description/slug.'
            },
            status: {
                type: 'string',
                enum: ['publish', 'draft', 'auto-draft', 'trash'],
                description: 'Filter by template status. Defaults to publish.'
            },
            per_page: {
                type: 'number',
                description: 'Number of templates to fetch per page (max 100). Defaults to 50.',
                default: 50
            },
            page: {
                type: 'number',
                description: 'Page number for pagination. Defaults to 1.',
                default: 1
            }
        }
    }
};

export const applyGutenbergTemplateTool: SuggerenceMCPResponseTool = {
    name: 'apply_gutenberg_template',
    description: 'Assigns an existing block template to the current post/page (or a provided post). Use list_gutenberg_templates to discover slugs, then pass the slug here.',
    inputSchema: {
        type: 'object',
        properties: {
            template_slug: {
                type: 'string',
                description: 'Template slug to assign (e.g., "landing" or "twentytwentyfive//landing"—slug is preferred).',
                required: true
            },
            post_id: {
                type: 'number',
                description: 'Optional explicit post/page ID. Defaults to the current post.'
            },
            post_type: {
                type: 'string',
                description: 'Optional post type slug for post_id (e.g., "page", "post"). Defaults to the current post type.'
            }
        },
        required: ['template_slug']
    }
};

function sanitizeSlug(raw?: string): string {
    if (!raw) {
        return `ai-template-${Date.now()}`;
    }

    const slug = raw
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return slug || `ai-template-${Date.now()}`;
}

async function getActiveThemeSlug(): Promise<string | null> {
    try {
        const themes: any = await apiFetch({
            path: 'wp/v2/themes?status=active',
            method: 'GET'
        });

        if (Array.isArray(themes) && themes.length > 0) {
            const theme = themes[0];
            return theme.stylesheet || theme.slug || theme.id || null;
        }
    } catch (error) {
        console.warn('Could not fetch active theme via REST:', error);
    }

    try {
        const blockEditorSelect = select('core/block-editor') as any;
        const settings = blockEditorSelect?.getSettings?.();
        if (settings?.theme) {
            return settings.theme;
        }
    } catch (error) {
        console.warn('Could not determine active theme from editor settings:', error);
    }

    return null;
}

function createBlockFromDefinition(blockDef: TemplateBlockDefinition): any | null {
    const blockType = blockDef.block_type || blockDef.blockType || blockDef.name;
    if (!blockType) {
        return null;
    }

    const attributes = {
        ...(blockDef.attributes || {}),
        ...(blockDef.style ? { style: blockDef.style } : {})
    };

    const innerBlockDefs = blockDef.inner_blocks || blockDef.innerBlocks || [];
    const innerBlocks = innerBlockDefs
        .map(def => createBlockFromDefinition(def))
        .filter(Boolean) || [];

    return innerBlocks.length > 0
        ? createBlock(blockType, attributes, innerBlocks)
        : createBlock(blockType, attributes);
}

function serializeTemplateBlocks(blocks?: TemplateBlockDefinition[]): string | null {
    if (!blocks || blocks.length === 0) {
        return null;
    }

    const wpBlocks = blocks
        .map(def => createBlockFromDefinition(def))
        .filter(Boolean);

    if (!wpBlocks.length) {
        return null;
    }

    return serialize(wpBlocks as any);
}

async function applyTemplateToPost(templateId: string, templateSlug: string, postId?: number, postType?: string): Promise<any> {
    const editorSelect = select('core/editor') as any;
    const editorDispatch = dispatch('core/editor') as any;
    const currentPost = editorSelect?.getCurrentPost?.();
    const targetId = postId || currentPost?.id;
    const targetType = postType || currentPost?.type || 'post';

    if (!targetId) {
        return { applied: false, error: 'No post ID available to apply the template' };
    }

    // Prefer slug for the post template value to satisfy REST validation enums
    const postTemplateValue = templateSlug || templateId;

    // If targeting the currently open post, update via editor dispatch so UI stays in sync
    if (!postId || targetId === currentPost?.id) {
        if (editorDispatch?.editPost) {
            editorDispatch.editPost({ template: postTemplateValue });
            return {
                applied: true,
                method: 'editor_dispatch',
                target: { id: targetId, type: targetType }
            };
        }
    }

    // Fallback: update the post via REST (handles applying to other posts)
    const endpoint = targetType === 'page' ? 'wp/v2/pages' : `wp/v2/${targetType}s`;
    await apiFetch({
        path: `${endpoint}/${targetId}`,
        method: 'POST',
        data: { template: postTemplateValue }
    });

    return {
        applied: true,
        method: 'rest_update',
        target: { id: targetId, type: targetType }
    };
}

export async function createGutenbergTemplate(args: CreateTemplateArgs): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        let themeSlug = await getActiveThemeSlug();

        if (!themeSlug) {
            try {
                const editorSelect = select('core/editor') as any;
                const currentTemplateId = editorSelect?.getEditedPostAttribute?.('template') ||
                    editorSelect?.getCurrentPost?.()?.template;

                if (typeof currentTemplateId === 'string' && currentTemplateId.includes('//')) {
                    themeSlug = currentTemplateId.split('//')[0];
                }
            } catch (error) {
                console.warn('Could not derive theme from current template:', error);
            }
        }

        if (!themeSlug) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'template_creation_failed',
                        error: 'Active theme could not be detected. Please ensure block editor context is available.'
                    })
                }]
            };
        }
        const slug = sanitizeSlug(args.template_slug || args.template_title);
        const title = args.template_title || slug;

        let content = args.template_content?.trim();
        if (!content && args.template_blocks) {
            content = serializeTemplateBlocks(args.template_blocks) || undefined;
        }

        if (!content) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'template_creation_failed',
                        error: 'Template content is missing. Provide template_content (serialized blocks) or template_blocks to build the template.'
                    })
                }]
            };
        }

        const templateId = themeSlug ? `${themeSlug}//${slug}` : slug;
        let existingTemplate: any = null;

        try {
            existingTemplate = await apiFetch({
                path: `wp/v2/templates/${encodeURIComponent(templateId)}`,
                method: 'GET'
            });
        } catch (error: any) {
            // 404 means it doesn't exist yet
            if (error?.code !== 'rest_template_not_found') {
                console.warn('Template lookup error:', error);
            }
        }

        if (existingTemplate && args.overwrite_existing === false) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'template_exists',
                        error: `Template "${templateId}" already exists and overwrite_existing is false.`,
                        template_id: templateId
                    })
                }]
            };
        }

        let templateResponse: any = null;
        let action: string = 'template_created';

        if (existingTemplate) {
            templateResponse = await apiFetch({
                path: `wp/v2/templates/${encodeURIComponent(templateId)}`,
                method: 'POST',
                data: {
                    content,
                    title,
                    description: args.template_description ?? existingTemplate.description ?? '',
                    status: 'publish'
                }
            });
            action = 'template_updated';
        } else {
            templateResponse = await apiFetch({
                path: 'wp/v2/templates',
                method: 'POST',
                data: {
                    slug,
                    theme: themeSlug || undefined,
                    title,
                    description: args.template_description,
                    status: 'publish',
                    content
                }
            });
        }

        let applyResult: any = null;

        if (args.apply_to_post !== false) {
            try {
                applyResult = await applyTemplateToPost(
                    templateResponse?.id || templateId,
                    templateResponse?.slug || slug,
                    args.post_id,
                    args.post_type
                );
            } catch (applyError) {
                applyResult = {
                    applied: false,
                    error: applyError instanceof Error ? applyError.message : 'Unknown error applying template'
                };
            }
        }

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action,
                    data: {
                        template_id: templateResponse?.id || templateId,
                        template_slug: templateResponse?.slug || slug,
                        theme: themeSlug,
                        applied: applyResult
                    }
                }, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'template_creation_failed',
                    error: `Error creating template: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

export async function listGutenbergTemplates(args: ListTemplatesArgs = {}): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const themeSlug = await getActiveThemeSlug();

        if (!themeSlug) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'list_templates_failed',
                        error: 'Active theme could not be detected.'
                    })
                }]
            };
        }

        const params = new URLSearchParams();
        params.set('theme', themeSlug);
        params.set('per_page', String(Math.min(args.per_page || 50, 100)));
        params.set('page', String(args.page || 1));

        if (args.search) {
            params.set('search', args.search);
        }
        if (args.status) {
            params.set('status', args.status);
        }

        const templates: any[] = await apiFetch({
            path: `wp/v2/templates?${params.toString()}`,
            method: 'GET'
        });

        const formatted = (templates || []).map((tpl: any) => ({
            id: tpl.id,
            slug: tpl.slug,
            title: tpl.title?.rendered || tpl.title || tpl.slug,
            description: tpl.description || '',
            status: tpl.status,
            theme: tpl.theme,
            type: tpl.type,
            source: tpl.source
        }));

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'templates_listed',
                    data: {
                        total: formatted.length,
                        templates: formatted
                    }
                }, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'list_templates_failed',
                    error: `Error listing templates: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}

export async function applyGutenbergTemplate(args: ApplyTemplateArgs): Promise<{ content: Array<{ type: string, text: string }> }> {
    try {
        const themeSlug = await getActiveThemeSlug();
        if (!themeSlug) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'apply_template_failed',
                        error: 'Active theme could not be detected.'
                    })
                }]
            };
        }

        const slug = args.template_slug?.trim();
        if (!slug) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'apply_template_failed',
                        error: 'Template slug is required.'
                    })
                }]
            };
        }

        const templateId = slug.includes('//') ? slug : `${themeSlug}//${slug}`;

        let template: any = null;
        try {
            template = await apiFetch({
                path: `wp/v2/templates/${encodeURIComponent(templateId)}`,
                method: 'GET'
            });
        } catch (error: any) {
            if (error?.code !== 'rest_template_not_found') {
                throw error;
            }
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: false,
                        action: 'apply_template_failed',
                        error: `Template "${slug}" not found for theme "${themeSlug}".`
                    })
                }]
            };
        }

        const applyResult = await applyTemplateToPost(
            template?.id || templateId,
            template?.slug || slug,
            args.post_id,
            args.post_type
        );

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    action: 'template_applied',
                    data: {
                        template_id: template?.id || templateId,
                        template_slug: template?.slug || slug,
                        template_title: template?.title?.rendered || template?.title || slug,
                        theme: themeSlug,
                        applied: applyResult
                    }
                }, null, 2)
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: false,
                    action: 'apply_template_failed',
                    error: `Error applying template: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
            }]
        };
    }
}
