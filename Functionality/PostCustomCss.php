<?php

namespace SuggerenceGutenberg\Functionality;

class PostCustomCss
{
    public function __construct()
    {
        add_action('init', [$this, 'register_meta']);
        add_action('wp_head', [$this, 'print_custom_css']);
    }

    public function register_meta(): void
    {
        $post_types = get_post_types(
            [
                'public' => true,
                'show_ui' => true,
            ],
            'names'
        );

        foreach ($post_types as $post_type) {
            register_post_meta(
                $post_type,
                'suggerence_custom_css',
                [
                    'single' => true,
                    'type' => 'string',
                    'show_in_rest' => true,
                    'sanitize_callback' => [$this, 'sanitize_css'],
                ]
            );
        }
    }

    public function sanitize_css($value): string
    {
        if ($value === null) {
            return '';
        }

        if (is_array($value)) {
            $value = implode("\n", $value);
        }

        return trim((string) $value);
    }

    public function print_custom_css(): void
    {
        if (!is_singular()) {
            return;
        }

        $post = get_post();

        if (!$post instanceof \WP_Post) {
            return;
        }

        $css = get_post_meta($post->ID, 'suggerence_custom_css', true);

        if (!$css) {
            return;
        }

        $css = trim((string) $css);

        if ($css === '') {
            return;
        }

        $scope_selector = $this->get_scope_selector($post);

        if (!$this->is_css_scoped($css, $scope_selector)) {
            $css = $this->scope_css($css, $scope_selector);
        }

        $scoped_css = str_ireplace('</style', '<\\/style', $css);

        printf(
            '<style data-suggerence-custom-css="%s">%s</style>',
            esc_attr($post->ID),
            $scoped_css
        );
    }

    private function get_scope_selector(\WP_Post $post): string
    {
        $post_type = get_post_type($post);

        if ($post_type === 'page') {
            return "body.page-id-{$post->ID}";
        }

        return "body.postid-{$post->ID}";
    }

    private function is_css_scoped(string $css, string $scope): bool
    {
        return strpos($css, $scope) !== false;
    }

    private function scope_css(string $css, string $scope): string
    {
        $callback = function ($matches) use ($scope) {
            $selector = trim($matches[1]);

            if ($selector === '' || str_starts_with($selector, '@')) {
                return $matches[0];
            }

            $parts = array_filter(
                array_map(
                    'trim',
                    explode(',', $selector)
                )
            );

            if (empty($parts)) {
                return $matches[0];
            }

            $prefixed = array_map(
                fn ($part) => "{$scope} {$part}",
                $parts
            );

            return implode(', ', $prefixed) . '{';
        };

        $scoped = preg_replace_callback('/([^{}]+)\{/', $callback, $css);

        return $scoped ?? $css;
    }
}
