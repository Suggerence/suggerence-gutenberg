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
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\ToolResultMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\Messages\UserMessage;
use SuggerenceGutenberg\Components\Ai\ValueObjects\ToolResult;
use SuggerenceGutenberg\Components\Ai\ValueObjects\ToolCall;
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

        // POST /openverse/sideload - Download and upload Openverse image
        $openverse_sideload_endpoint = new PostEndpoint(
            $this->namespace,
            'openverse/sideload',
            [$this, 'sideload_openverse_image'],
            [$this, 'admin_permissions_check']
        );
        $openverse_sideload_endpoint->useMiddleware($corsMiddleware);
        $endpoints[] = $openverse_sideload_endpoint;

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

        // Build messages array, injecting assistant messages before tool results
        $processedMessages = [];
        
        foreach ($messages as $message) {
                       
            // Process the actual message
            if ($message['role'] === 'assistant') {                
                $processedMessages[] = new AssistantMessage(
                    content: $message['content'],
                );
            }
            elseif ($message['role'] === 'tool') {
                $toolResults = [];
                
                if (isset($message['toolCallId']) && isset($message['toolName'])) {
                    $processedMessages[] = new AssistantMessage('', toolCalls: [
                        new ToolCall(
                            id: $message['toolCallId'],
                            name: $message['toolName'],
                            arguments: $message['toolArgs'] ?? []
                        )
                    ]);

                    $toolResult = new ToolResult(
                        toolCallId: $message['toolCallId'],
                        toolName: $message['toolName'] ?? '',
                        args: $message['toolArgs'] ?? [],
                        result: $message['toolResult'] ?? $message['content'],
                    );
    
                    $toolResults[] = $toolResult;
                }

                $processedMessages[] = new ToolResultMessage($toolResults);
            }

            elseif ($message['role'] === 'user') {
                // Handle user messages - check if content is multi-modal (array) or simple text
                $content = $message['content'];

                if (is_array($content)) {
                    // Multi-modal message with text, images, and audio
                    $textContent = '';
                    $additionalContent = [];

                    foreach ($content as $item) {
                        if ($item['type'] === 'text') {
                            $textContent .= $item['text'];
                        } elseif ($item['type'] === 'image') {
                            // Handle both base64 data (drawings) and URLs (media library images)
                            if (isset($item['source']['data'])) {
                                // Base64 image (e.g., from canvas drawings)
                                $imageBase64 = $item['source']['data'];
                                $mimeType = $item['source']['media_type'];

                                $additionalContent[] = \SuggerenceGutenberg\Components\Ai\ValueObjects\Media\Image::fromBase64(
                                    $imageBase64,
                                    $mimeType
                                );
                            } elseif (isset($item['source']['url'])) {
                                // Image URL (e.g., from media library)
                                $imageUrl = $item['source']['url'];

                                $additionalContent[] = \SuggerenceGutenberg\Components\Ai\ValueObjects\Media\Image::fromUrl($imageUrl);
                            }
                        } elseif ($item['type'] === 'audio') {
                            // Handle audio input similar to images
                            if (isset($item['source']['data'])) {
                                // Base64 audio data
                                $audioBase64 = $item['source']['data'];
                                $mimeType = $item['source']['media_type'];

                                $additionalContent[] = \SuggerenceGutenberg\Components\Ai\ValueObjects\Media\Audio::fromBase64(
                                    $audioBase64,
                                    $mimeType
                                );
                            } elseif (isset($item['source']['url'])) {
                                // Audio URL (e.g., from media library)
                                $audioUrl = $item['source']['url'];

                                $additionalContent[] = \SuggerenceGutenberg\Components\Ai\ValueObjects\Media\Audio::fromUrl($audioUrl);
                            }
                        }
                    }


                    $processedMessages[] = new UserMessage($textContent, $additionalContent);
                } else {
                    // Simple text message
                    $processedMessages[] = new UserMessage($content);
                }
            }
        }

        $text->withMessages($processedMessages);

        if ($tools) {
            $tools = array_map(fn($tool) => Tool::formatFromSchema($tool), $tools);
            $text->withTools($tools);
        }

        $result = $text->asText();

        // Check if this is a tool call response
        if ($result->finishReason === FinishReason::ToolCalls) {
            // Return assistant message with tool call information
            // The frontend will execute the tool and send back the result
            return [
                'role'      => 'assistant',
                'content'   => $result->steps[0]->text,
                'date'      => date('Y-m-d H:i:s'),
                'aiModel'   => $model,
                'toolCallId' => $result->toolCalls[0]->id,
                'toolName' => $result->toolCalls[0]->name,
                'toolArgs' => $result->toolCalls[0]->arguments()
            ];
        }

        // Regular text response
        return [
            'role'      => 'assistant',
            'content'   => $result->steps[0]->text,
            'date'      => date('Y-m-d H:i:s'),
            'aiModel'   => $model
        ];
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
     * - input_images (array, optional): Array of input images to use as reference
     * - edit_image_url (string, optional): URL of image to edit (for image editing mode)
     * - edit_mode (boolean, optional): Set to true to enable image editing mode
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
            $input_images = $body['input_images'] ?? [];
            $edit_image_url = $body['edit_image_url'] ?? '';
            $edit_mode = $body['edit_mode'] ?? false;

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

            // Create AI images instance
            $imageGenerator = AI::images()->using($provider, $model);

            // Handle image editing mode
            if ($edit_mode && !empty($edit_image_url)) {
                // Download the image and create a resource for editing
                $imageContent = wp_remote_get($edit_image_url);
                if (is_wp_error($imageContent)) {
                    return new \WP_REST_Response([
                        'success' => false,
                        'error' => 'Failed to download image for editing: ' . $imageContent->get_error_message()
                    ], 400);
                }

                $imageData = wp_remote_retrieve_body($imageContent);
                if (empty($imageData)) {
                    return new \WP_REST_Response([
                        'success' => false,
                        'error' => 'Empty image data received for editing'
                    ], 400);
                }

                // Create a resource from the image data
                $imageResource = fopen('php://memory', 'r+');
                fwrite($imageResource, $imageData);
                rewind($imageResource);

                // Get the image MIME type from the response headers
                $mimeType = 'image/png'; // default
                $headers = wp_remote_retrieve_headers($imageContent);
                if (isset($headers['content-type'])) {
                    $mimeType = $headers['content-type'];
                }

                if (empty($provider)) {
                    $provider = 'suggerence';
                    $model = 'suggerence-v1';
                    $imageGenerator = AI::images()->using($provider, $model);
                }

                // For image editing, pass the image resource in provider options
                $images = $imageGenerator
                    ->withPrompt($prompt)
                    ->withProviderOptions([
                        'image' => $imageResource,
                        'image_mime_type' => $mimeType,
                        'size' => $size,
                        'quality' => $quality,
                        'style' => $style
                    ])
                    ->asImages();

                // Close the resource
                fclose($imageResource);
            } else {
                // Handle input images for multimodal generation (reference mode)
                if (!empty($input_images)) {
                    $additionalContent = [];

                    foreach ($input_images as $inputImage) {
                        if (is_string($inputImage)) {
                            // Simple URL string
                            $additionalContent[] = \SuggerenceGutenberg\Components\Ai\ValueObjects\Media\Image::fromUrl($inputImage);
                        } elseif (is_array($inputImage)) {
                            if (isset($inputImage['data']) && isset($inputImage['media_type'])) {
                                // Base64 image object
                                $additionalContent[] = \SuggerenceGutenberg\Components\Ai\ValueObjects\Media\Image::fromBase64(
                                    $inputImage['data'],
                                    $inputImage['media_type']
                                );
                            } elseif (isset($inputImage['url'])) {
                                // Image URL object
                                $additionalContent[] = \SuggerenceGutenberg\Components\Ai\ValueObjects\Media\Image::fromUrl($inputImage['url']);
                            }
                        }
                    }

                    // Use withPrompt with additional content for multimodal input
                    $imageGenerator = $imageGenerator->withPrompt($prompt, $additionalContent);
                } else {
                    // Simple prompt-only generation
                    $imageGenerator = $imageGenerator->withPrompt($prompt);
                }

                $images = $imageGenerator
                    ->withProviderOptions([
                        'size' => $size,
                        'quality' => $quality,
                        'style' => $style
                    ])
                    ->asImages();
            }

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

    /**
     * Sideload (download and upload) an Openverse image to WordPress Media Library
     */
    public function sideload_openverse_image($request)
    {
        $params = $request->get_json_params();
        
        // Validate required parameters
        if (empty($params['image_url'])) {
            return new WP_REST_Response([
                'success' => false,
                'error' => 'Missing required parameter: image_url'
            ], 400);
        }

        $image_url = esc_url_raw($params['image_url']);
        $title = !empty($params['title']) ? sanitize_text_field($params['title']) : 'Openverse Image';
        $alt_text = !empty($params['alt_text']) ? sanitize_text_field($params['alt_text']) : '';
        $caption = '';
        $description = '';

        // Build attribution caption if creator/license info provided
        if (!empty($params['creator']) || !empty($params['license'])) {
            $attribution_parts = [];
            
            if (!empty($params['creator'])) {
                $creator = sanitize_text_field($params['creator']);
                if (!empty($params['creator_url'])) {
                    $creator_url = esc_url($params['creator_url']);
                    $attribution_parts[] = sprintf('<a href="%s">%s</a>', $creator_url, $creator);
                } else {
                    $attribution_parts[] = $creator;
                }
            }
            
            if (!empty($params['license'])) {
                $license = sanitize_text_field($params['license']);
                if (!empty($params['license_url'])) {
                    $license_url = esc_url($params['license_url']);
                    $attribution_parts[] = sprintf('<a href="%s">%s</a>', $license_url, $license);
                } else {
                    $attribution_parts[] = $license;
                }
            }
            
            if (!empty($attribution_parts)) {
                $caption = 'Photo by ' . implode(' / ', $attribution_parts);
            }
        }

        // Download the image from Openverse
        $response = wp_remote_get($image_url, [
            'timeout' => 30,
            'user-agent' => 'WordPress-Gutenberg-Assistant/1.0'
        ]);

        if (is_wp_error($response)) {
            return new WP_REST_Response([
                'success' => false,
                'error' => 'Failed to download image: ' . $response->get_error_message()
            ], 500);
        }

        $response_code = wp_remote_retrieve_response_code($response);
        if ($response_code !== 200) {
            return new WP_REST_Response([
                'success' => false,
                'error' => 'Failed to download image: HTTP ' . $response_code
            ], 500);
        }

        $image_data = wp_remote_retrieve_body($response);
        
        if (empty($image_data)) {
            return new WP_REST_Response([
                'success' => false,
                'error' => 'Empty image data received'
            ], 500);
        }

        // Determine file extension from URL or content type
        $content_type = wp_remote_retrieve_header($response, 'content-type');
        $extension = 'jpg'; // default
        
        if (strpos($content_type, 'image/png') !== false) {
            $extension = 'png';
        } elseif (strpos($content_type, 'image/jpeg') !== false || strpos($content_type, 'image/jpg') !== false) {
            $extension = 'jpg';
        } elseif (strpos($content_type, 'image/webp') !== false) {
            $extension = 'webp';
        } elseif (strpos($content_type, 'image/gif') !== false) {
            $extension = 'gif';
        }

        // Generate filename
        $filename = sanitize_file_name(substr($title, 0, 50)) . '_' . time() . '.' . $extension;
        
        // Upload the image using WordPress functions
        $uploaded_image = wp_upload_bits($filename, null, $image_data);

        if (!empty($uploaded_image['error'])) {
            return new WP_REST_Response([
                'success' => false,
                'error' => 'Failed to upload image: ' . $uploaded_image['error']
            ], 500);
        }

        // Determine mime type
        $mime_type = 'image/jpeg';
        if ($extension === 'png') {
            $mime_type = 'image/png';
        } elseif ($extension === 'webp') {
            $mime_type = 'image/webp';
        } elseif ($extension === 'gif') {
            $mime_type = 'image/gif';
        }

        // Create WordPress attachment
        $attachment_data = [
            'post_mime_type' => $mime_type,
            'post_title' => $title,
            'post_content' => $description,
            'post_status' => 'publish',
            'post_author' => get_current_user_id()
        ];

        if (!empty($caption)) {
            $attachment_data['post_excerpt'] = $caption;
        }

        $attachment_id = wp_insert_attachment($attachment_data, $uploaded_image['file']);
        
        if (is_wp_error($attachment_id)) {
            return new WP_REST_Response([
                'success' => false,
                'error' => 'Failed to create attachment: ' . $attachment_id->get_error_message()
            ], 500);
        }

        // Set alt text
        if (!empty($alt_text)) {
            update_post_meta($attachment_id, '_wp_attachment_image_alt', $alt_text);
        }

        // Generate attachment metadata (thumbnails, etc.)
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        $attachment_metadata = wp_generate_attachment_metadata($attachment_id, $uploaded_image['file']);
        wp_update_attachment_metadata($attachment_id, $attachment_metadata);

        $attachment_url = wp_get_attachment_url($attachment_id);

        return new WP_REST_Response([
            'success' => true,
            'message' => 'Openverse image uploaded successfully',
            'attachment_id' => $attachment_id,
            'image_url' => $attachment_url,
            'alt_text' => $alt_text,
            'caption' => $caption,
            'sizes' => $attachment_metadata['sizes'] ?? []
        ], 200);
    }
}
