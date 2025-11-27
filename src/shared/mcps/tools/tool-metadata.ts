interface ToolMetadata {
    deferLoading?: boolean;
    inputExamples?: Record<string, any>[];
}

const TOOL_METADATA: Record<string, ToolMetadata> = {
    think: {
        deferLoading: false,
        inputExamples: [
            {
                thinking: 'Add block failed because reference block was deleted. Re-evaluate the layout and pick a new anchor.'
            }
        ]
    },
    add_block: {
        deferLoading: true,
        inputExamples: [
            {
                block_type: 'core/heading',
                attributes: {
                    content: 'Welcome to our studio',
                    level: 2
                },
                style: {
                    color: { text: '#1f2937' },
                    typography: { fontSize: '32px' }
                },
                position: 'after',
                relative_to_block_id: 'selected-block-id'
            }
        ]
    },
    move_block: {
        deferLoading: true,
        inputExamples: [
            {
                block_id: 'testimonial-grid',
                relative_to_block_id: 'pricing-section',
                position: 'before'
            }
        ]
    },
    duplicate_block: {
        deferLoading: true,
        inputExamples: [
            {
                block_id: 'hero-cta',
                position: 6
            }
        ]
    },
    delete_block: {
        deferLoading: true,
        inputExamples: [
            {
                block_id: 'unused-text-block'
            }
        ]
    },
    update_block: {
        deferLoading: true,
        inputExamples: [
            {
                block_id: 'hero-heading',
                attributes: {
                    content: 'Design calm, focused workspaces'
                },
                style: {
                    color: { text: '#0f172a' }
                }
            }
        ]
    },
    transform_block: {
        deferLoading: true,
        inputExamples: [
            {
                block_id: 'intro-paragraph',
                transform_to: 'core/quote'
            }
        ]
    },
    wrap_block: {
        deferLoading: true,
        inputExamples: [
            {
                block_ids: ['image-left', 'text-right'],
                wrapper_block_type: 'core/columns',
                column_widths: ['40%', '60%']
            }
        ]
    },
    undo: {
        deferLoading: true,
        inputExamples: [{}]
    },
    redo: {
        deferLoading: true,
        inputExamples: [{}]
    },
    get_available_blocks: {
        deferLoading: true,
        inputExamples: [
            {
                include_inactive: false,
                category: 'text'
            }
        ]
    },
    get_block_schema: {
        deferLoading: false,
        inputExamples: [
            {
                block_type: 'core/cover'
            }
        ]
    },
    search_pattern: {
        deferLoading: true,
        inputExamples: [
            {
                search: 'pricing',
                category: ''
            }
        ]
    },
    insert_pattern: {
        deferLoading: true,
        inputExamples: [
            {
                pattern_name: 'twentytwentyfour/hero',
                position: 'after',
                relative_to_block_id: 'selected-block-id'
            }
        ]
    },
    generate_image: {
        deferLoading: true,
        inputExamples: [
            {
                prompt: 'Minimalist hero illustration showing a modern workspace with plants and natural light',
                alt_text: 'Illustration of a tidy desk with greenery'
            }
        ]
    },
    generate_edited_image: {
        deferLoading: true,
        inputExamples: [
            {
                image_url: 'https://example.com/uploads/hero.png',
                prompt: 'Add a translucent teal overlay and soften contrast',
                alt_text: 'Updated hero banner with teal overlay'
            }
        ]
    },
    search_media: {
        deferLoading: true,
        inputExamples: [
            {
                search: 'team collaboration',
                media_type: 'image',
                per_page: 12
            }
        ]
    },
    get_media_details: {
        deferLoading: true,
        inputExamples: [
            {
                media_id: 305
            }
        ]
    },
    search_openverse: {
        deferLoading: true,
        inputExamples: [
            {
                query: 'modern home office',
                per_page: 6,
                license: 'cc-by'
            }
        ]
    },
    upload_openverse_to_media: {
        deferLoading: true,
        inputExamples: [
            {
                image_id: 'openverse-12345',
                image_url: 'https://images.openverse.engine/photos/workspace.jpg',
                title: 'Calm workspace inspiration',
                creator: 'Alex Rivera',
                license: 'CC BY',
                license_url: 'https://creativecommons.org/licenses/by/4.0/'
            }
        ]
    },
    get_document_structure: {
        deferLoading: true,
        inputExamples: [
            {
                include_content: true,
                max_content_length: 80
            }
        ]
    },
    search_blocks_by_content: {
        deferLoading: true,
        inputExamples: [
            {
                search_query: 'pricing plan',
                block_type: 'core/paragraph',
                case_sensitive: false
            }
        ]
    },
    get_post_metadata: {
        deferLoading: true,
        inputExamples: [{}]
    },
    update_post_title: {
        deferLoading: true,
        inputExamples: [
            {
                title: 'Designing a productive home office in 2025'
            }
        ]
    },
    update_post_excerpt: {
        deferLoading: true,
        inputExamples: [
            {
                excerpt: 'Practical steps and layout ideas for creating a calming, productive workspace at home.'
            }
        ]
    },
    set_featured_image: {
        deferLoading: true,
        inputExamples: [
            {
                media_id: 482
            }
        ]
    },
    remove_featured_image: {
        deferLoading: true,
        inputExamples: [{}]
    },
    generate_custom_css: {
        deferLoading: true,
        inputExamples: [
            {
                css_rules: '.hero-banner { padding: 4rem 2rem; background: linear-gradient(135deg,#0ea5e9,#2563eb); }',
                mode: 'replace',
                description: 'Match the requested gradient hero background'
            }
        ]
    },
    get_post_content: {
        deferLoading: true,
        inputExamples: [
            {
                post_id: 134,
                post_type: 'page',
                context: 'edit'
            }
        ]
    },
    capture_frontend_screenshot: {
        deferLoading: true,
        inputExamples: [
            {
                viewport: 'desktop',
                full_height: true
            }
        ]
    },
    generate_alt_text_suggestion: {
        deferLoading: true,
        inputExamples: [
            {
                block_id: 'image-42',
                context: 'Hero portrait for the About page'
            }
        ]
    },
    generate_heading_suggestion: {
        deferLoading: true,
        inputExamples: [
            {
                block_id: 'heading-7',
                level: 2,
                content: 'What we do',
                context: 'Services section summary'
            }
        ]
    },
    generate_content_suggestion: {
        deferLoading: true,
        inputExamples: [
            {
                block_id: 'paragraph-3',
                suggestion_type: 'clarity',
                current_content: 'Our agency offers integrated design and development services.'
            }
        ]
    },
    apply_suggestion: {
        deferLoading: true,
        inputExamples: [
            {
                block_id: 'paragraph-3',
                suggestion_type: 'content',
                suggested_value: 'We pair designers and engineers to polish every digital touchpoint.'
            }
        ]
    }
};

export const getToolMetadata = (toolName: string): ToolMetadata => TOOL_METADATA[toolName] || {};
