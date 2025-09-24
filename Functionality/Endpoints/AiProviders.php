<?php

namespace SuggerenceGutenberg\Functionality\Endpoints;

use SuggerenceGutenberg\Functionality\BaseApiEndpoints;
use PluboRoutes\Endpoint\GetEndpoint;
use PluboRoutes\Endpoint\PostEndpoint;
use PluboRoutes\Middleware\Cors;

use SuggerenceGutenberg\Components\Ai\AI;
use SuggerenceGutenberg\Components\Ai\Enums\FinishReason;
use SuggerenceGutenberg\Components\Ai\Enums\Provider as ProviderEnum;
use SuggerenceGutenberg\Components\Ai\Manager as AIManager;
use SuggerenceGutenberg\Components\Ai\Tool;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\AssistantMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\UserMessage;
use \WP_REST_Response;
use \WP_Error;

/**
 * AI Providers endpoints
 * Handles API key management for AI providers
 */
class AiProviders extends BaseApiEndpoints
{
    public function __construct($plugin_name, $plugin_version)
    {
        parent::__construct($plugin_name, $plugin_version, 'suggerence-gutenberg/ai-providers/v1');
    }

    /**
     * Define AI Providers endpoints
     */
    public function define_endpoints()
    {
        // CORS middleware for MCP client endpoints
        $corsMiddleware = new Cors('*', ['GET', 'POST', 'OPTIONS'], ['Content-Type', 'Authorization', 'X-Requested-With']);

        $endpoints = [];

        // GET /providers - Get all providers with their configuration status
        $get_providers_endpoint = new GetEndpoint(
            $this->namespace,
            'providers',
            [$this, 'get_providers'],
            [$this, 'admin_permissions_check']
        );
        $get_providers_endpoint->useMiddleware($corsMiddleware);
        $endpoints[] = $get_providers_endpoint;

        // GET /providers/models - Get all models from all providers
        $get_models_endpoint = new GetEndpoint(
            $this->namespace,
            'providers/models',
            [$this, 'get_models'],
            [$this, 'admin_permissions_check']
        );
        $get_models_endpoint->useMiddleware($corsMiddleware);
        $endpoints[] = $get_models_endpoint;

        // GET /providers/{provider_id}/models - Get all models from a specific provider
        $get_provider_models_endpoint = new GetEndpoint(
            $this->namespace,
            'providers/(?P<provider_id>[a-zA-Z0-9_-]+)/models',
            [$this, 'get_provider_models'],
            [$this, 'admin_permissions_check']
        );
        $get_provider_models_endpoint->useMiddleware($corsMiddleware);
        $endpoints[] = $get_provider_models_endpoint;

        // POST /providers/generate - Generate text using AI providers
        $generate_endpoint = new PostEndpoint(
            $this->namespace,
            'providers/text',
            [$this, 'generate_text'],
            [$this, 'admin_permissions_check']
        );
        $generate_endpoint->useMiddleware($corsMiddleware);
        $endpoints[] = $generate_endpoint;

        // POST /providers/image - Generate image using AI providers
        $generate_image_endpoint = new PostEndpoint(
            $this->namespace,
            'providers/image',
            [$this, 'generate_image'],
            [$this, 'admin_permissions_check']
        );
        $generate_image_endpoint->useMiddleware($corsMiddleware);
        $endpoints[] = $generate_image_endpoint;

        // POST /providers/{provider_id}/api-key - Set API key for a provider
        $set_api_key_endpoint = new PostEndpoint(
            $this->namespace,
            'providers/(?P<provider_id>[a-zA-Z0-9_-]+)/api-key',
            [$this, 'set_provider_api_key'],
            [$this, 'admin_permissions_check']
        );
        $set_api_key_endpoint->useMiddleware($corsMiddleware);
        $endpoints[] = $set_api_key_endpoint;

        // DELETE /providers/{provider_id}/api-key - Remove API key for a provider
        $remove_api_key_endpoint = new PostEndpoint(
            $this->namespace,
            'providers/(?P<provider_id>[a-zA-Z0-9_-]+)/remove',
            [$this, 'remove_provider_api_key'],
            [$this, 'admin_permissions_check']
        );
        $remove_api_key_endpoint->useMiddleware($corsMiddleware);
        $endpoints[] = $remove_api_key_endpoint;

        return $endpoints;
    }

    /**
     * Get all available providers with their configuration status
     */
    public function get_providers()
    {
        return array_map(fn($provider) => $provider->info(), AI::providers());
    }

    /**
     * Get all models from all providers
     */
    public function get_models()
    {
        $providers = AI::providers();

        return array_map(fn($provider) => $provider->models(), $providers);
    }

    /**
     * Get all models from a specific provider
     */
    public function get_provider_models($request)
    {
        $provider_id = $request->get_param('provider_id');

        $provider = AI::provider($provider_id);

        return $provider->models();
    }

    /**
     * Generate text using AI providers
     */
    public function generate_text($request)
    {
        $provider_id    = $request->get_param('provider');
        $model          = $request->get_param('model');
        $system         = $request->get_param('system');
        $messages       = $request->get_param('messages');
        $tools          = $request->get_param('tools');

        if (empty($provider_id)) {
            return new WP_Error(400, 'Provider ID is required');
        }

        if (empty($model)) {
            return new WP_Error(400, 'Model is required');
        }

        if (empty($messages)) {
            return new WP_Error(400, 'Messages are required');
        }

        $text = AI::text()->using($provider_id, $model);

        if ($system) {
            $text->withSystemPrompt($system);
        }

        $text->withMessages(
            array_map(function($message) {
                if ($message['role'] === 'assistant') {
                    return new AssistantMessage($message['content']);
                }

                // Handle user messages - check if content is multi-modal (array) or simple text
                $content = $message['content'];

                if (is_array($content)) {
                    // Multi-modal message with text and images
                    $textContent = '';
                    $additionalContent = [];

                    foreach ($content as $item) {
                        if ($item['type'] === 'text') {
                            $textContent .= $item['text'];
                        } elseif ($item['type'] === 'image') {
                            // Create Image from base64 data
                            $imageBase64 = $item['source']['data'];
                            $mimeType = $item['source']['media_type'];

                            $additionalContent[] = \SuggerenceGutenberg\Components\Ai\ValueObjects\Media\Image::fromBase64(
                                $imageBase64,
                                $mimeType
                            );
                        }
                    }

                    return new UserMessage($textContent, $additionalContent);
                } else {
                    // Simple text message
                    return new UserMessage($content);
                }
            }, $messages)
        );

        if ($tools) {
            $tools = array_map(fn($tool) => Tool::formatFromSchema($tool), $tools);
            $text->withTools($tools);
        }

        $result = $text->asText();

        $response = [
            'role'      => 'assistant',
            'content'   => $result->steps[0]->text,
            'date'      => date('Y-m-d H:i:s'),

            'aiModel'   => $model
        ];

        if ($result->finishReason === FinishReason::ToolCalls) {
            $response['role'] = 'tool';
            $response = [
                ...$response,
                'toolName'  => $result->toolCalls[0]->name,
                'toolArgs'  => $result->toolCalls[0]->arguments
            ];
        }

        return $response;
    }

    /**
     * Set API key for a provider
     */
    public function set_provider_api_key($request)
    {
        try {
            $provider_id = $request->get_param('provider_id');
            $api_key = $request->get_param('api_key');

            if (empty($provider_id)) {
                return new WP_Error(400, 'Provider ID is required');
            }

            if (empty($api_key)) {
                return new WP_Error(400, 'API key is required');
            }

            // Validate provider exists
            $available_providers = array_map(fn($case) => $case->value, ProviderEnum::cases());
            if (!in_array($provider_id, $available_providers)) {
                return new WP_Error(400, 'Invalid provider ID');
            }

            // Set the API key
            $success = AIManager::updateDefaultConfig($provider_id, ['api_key' => $api_key]);
            
            if ($success) {
                return new \WP_REST_Response([
                    'message' => 'API key saved successfully',
                    'provider_id' => $provider_id,
                    'configured' => true
                ]);
            } else {
                return new WP_Error(500, 'Failed to save API key');
            }
        } catch (\Exception $e) {
            return new WP_Error(500, 'Failed to set API key', ['message' => $e->getMessage()]);
        }
    }

    /**
     * Remove API key for a provider
     */
    public function remove_provider_api_key($request)
    {
        try {
            $provider_id = $request->get_param('provider_id');

            if (empty($provider_id)) {
                return new WP_Error(400, 'Provider ID is required');
            }

            // Validate provider exists
            $available_providers = array_map(fn($case) => $case->value, ProviderEnum::cases());
            if (!in_array($provider_id, $available_providers)) {
                return new WP_Error(400, 'Invalid provider ID');
            }

            // Remove the API key
            $success = AIManager::updateDefaultConfig($provider_id, []);

            if ($success) {
                return new \WP_REST_Response([
                    'message' => 'API key removed successfully',
                    'provider_id' => $provider_id,
                    'configured' => false
                ]);
            } else {
                return new WP_Error(500, 'Failed to remove API key');
            }
        } catch (\Exception $e) {
            return new WP_Error(500, 'Failed to remove API key', ['message' => $e->getMessage()]);
        }
    }

    /**
     * Generate image using AI providers
     * 
     * Body parameters:
     * - prompt (string, required): The text prompt describing the image to generate
     * - provider (string, required): The AI provider to use (gemini, openai, etc.)
     * - model (string, optional): Specific model to use (defaults to provider default)
     * - size (string, optional): Image size (e.g., '1024x1024', '512x512')
     * - quality (string, optional): Image quality (e.g., 'standard', 'hd')
     * - style (string, optional): Image style (e.g., 'vivid', 'natural')
     */
    public function generate_image($request)
    {
        try {
            $body = $request->get_json_params();
            
            $prompt = $body['prompt'] ?? '';
            $provider = $body['provider'] ?? '';
            $model = $body['model'] ?? '';
            $size = $body['size'] ?? '1024x1024';
            $quality = $body['quality'] ?? 'standard';
            $style = $body['style'] ?? 'vivid';

            // Validate required parameters
            if (empty($prompt)) {
                return new \WP_REST_Response([
                    'success' => false,
                    'error' => 'Prompt is required'
                ], 400);
            }

            if (empty($provider)) {
                return new \WP_REST_Response([
                    'success' => false,
                    'error' => 'Provider is required'
                ], 400);
            }

            // Use AI library for model-agnostic image generation
            $images = AI::images()->using($provider, $model)
                ->withPrompt($prompt)
                ->withProviderOptions([
                    'size' => $size,
                    'quality' => $quality,
                    'style' => $style
                ])
                ->asImages();

            // Convert AI library response to WordPress attachment
            $result = $this->saveImagesAsAttachments($images, $prompt);

            if (!$result['success']) {
                return new \WP_REST_Response([
                    'success' => false,
                    'error' => $result['error']
                ], 500);
            }

            return new \WP_REST_Response($result, 200);

        } catch (\Exception $e) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => 'Internal server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save AI library images as WordPress attachments
     */
    private function saveImagesAsAttachments($imagesResponse, $prompt)
    {
        if (!$imagesResponse->hasImages()) {
            return [
                'success' => false,
                'error' => 'No images generated'
            ];
        }

        // Get the first image
        $image = $imagesResponse->firstImage();
        if (!$image) {
            return [
                'success' => false,
                'error' => 'No image data available'
            ];
        }

        $image_data = null;
        $mime_type = 'image/png';

        // Handle different image formats from AI providers
        if ($image->hasBase64()) {
            // Handle base64 data (e.g., from Gemini)
            $image_data = base64_decode($image->base64);
            if ($image->hasMimeType()) {
                $mime_type = $image->mimeType;
            }
        } elseif ($image->hasUrl()) {
            // Handle URL data (e.g., from OpenAI)
            $image_data = wp_remote_get($image->url);
            if (is_wp_error($image_data)) {
                return [
                    'success' => false,
                    'error' => 'Failed to download image: ' . $image_data->get_error_message()
                ];
            }
            $image_data = wp_remote_retrieve_body($image_data);
        } else {
            return [
                'success' => false,
                'error' => 'No valid image data found'
            ];
        }

        if (empty($image_data)) {
            return [
                'success' => false,
                'error' => 'Empty image data received'
            ];
        }

        // Generate filename from prompt
        $extension = $mime_type === 'image/jpeg' ? 'jpg' : 'png';
        $filename = sanitize_file_name(substr($prompt, 0, 50)) . '_' . time() . '.' . $extension;
        
        // Upload the image
        $uploaded_image = wp_upload_bits($filename, null, $image_data);

        if (!empty($uploaded_image['error'])) {
            return [
                'success' => false,
                'error' => 'Failed to upload image: ' . $uploaded_image['error']
            ];
        }

        // Create WordPress attachment
        $attachment_id = wp_insert_attachment([
            'post_mime_type' => $mime_type,
            'post_title' => sanitize_text_field($prompt),
            'post_content' => '',
            'post_status' => 'publish',
            'post_author' => get_current_user_id()
        ], $uploaded_image['file']);
        
        if (is_wp_error($attachment_id)) {
            return [
                'success' => false,
                'error' => 'Failed to insert attachment: ' . $attachment_id->get_error_message()
            ];
        }

        // Generate attachment metadata
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        $attachment_data = wp_generate_attachment_metadata($attachment_id, $uploaded_image['file']);
        wp_update_attachment_metadata($attachment_id, $attachment_data);

        $image_url = wp_get_attachment_url($attachment_id);

        return [
            'success' => true,
            'message' => 'Image generated successfully',
            'attachment_id' => $attachment_id,
            'image_url' => $image_url
        ];
    }
}
