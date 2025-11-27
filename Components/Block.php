<?php

namespace SuggerenceGutenberg\Components;

class Block
{
    public const BLOCKS_FOLDER          = WP_CONTENT_DIR . '/blocks';
    public const BLOCKS_DEFINITION_FILE = 'suggerence.definition.json';
    public const BLOCKS_BUILD_FOLDER    = 'build';
    public const BLOCKS_BUILD_FILE_PATH = self::BLOCKS_BUILD_FOLDER . '/' . 'block.json';

    private $block_id;

    /**
     * Get the root folder for the block
     * @return string
     */
    public function root()
    {
        return self::BLOCKS_FOLDER . '/' . $this->block_id;
    }

    /**
     * Get the full path for a file or folder relative to the root folder
     * @param string $relative_path
     * @return string
     */
    public function file_path( $relative_path = '' )
    {
        $base_folder = rtrim( $this->root(), '/' );
        $relative_path = ltrim( $relative_path, '/' );

        return $base_folder . '/' . $relative_path;
    }

    /**
     * Check if a file or folder exists
     * @param string $relative_path
     * @return bool
     */
    public function file_exists( $relative_path = '' )
    {
        return file_exists( $this->file_path( $relative_path ) );
    }

    /**
     * Create a folder if it doesn't exist
     * @param string $relative_path
     * @return bool
     */
    public function make_folder( $relative_path = '' )
    {
        $folder_path = $this->file_path( $relative_path );

        if ( !file_exists( $folder_path ) ) {
            if ( !wp_mkdir_p( $folder_path ) ) {
                return false;
            }
        }

        return true;
    }

    /**
     * Create or update a file
     * @param string $relative_path
     * @param string $content
     * @return bool
     */
    public function make_file( $relative_path = '', $content = '' )
    {
        $file_path = $this->file_path( $relative_path );

        // Always write the file, whether it exists or not
        if ( file_put_contents( $file_path, $content ) === false ) {
            return false;
        }

        return true;
    }

    /**
     * Reads the content of a file
     * @param string $relative_path
     * @return string|false
     */
    public function read_file( $relative_path = '' )
    {
        $file_path = $this->file_path( $relative_path );

        if ( !file_exists( $file_path ) ) {
            return false;
        }

        return file_get_contents( $file_path );
    }

    /**
     * Sets up everything needed for the block generation
     * @return bool
     */
    public function setup()
    {
        // Create the blocks folder if it doesn't exist
        if ( !file_exists( self::BLOCKS_FOLDER ) ) {
            if ( !wp_mkdir_p( self::BLOCKS_FOLDER ) ) {
                return false;
            }
        }

        // Create the block folder if it doesn't exist
        $block_root = $this->root();
        if ( !file_exists( $block_root ) ) {
            if ( !wp_mkdir_p( $block_root ) ) {
                return false;
            }
        }

        return true;
    }

    /**
     * Constructor
     * @param string $block_id
     */
    public function __construct( $block_id )
    {
        $this->block_id = $block_id;
        $this->setup();
    }

    /**
     * Returns if the current block has its root folder created
     * @return bool
     */
    public function has_root_folder()
    {
        return file_exists($this->root());
    }

    /**
     * Writes the definition file for the block
     * @param string $description
     * @param string $status
     * @param string $date
     * @param string|null $parent_id
     * @param string|null $slug
     * @param string|null $title
     * @param string|null $icon
     * @param array|null $attributes
     * @param string $version
     * @param string|null $completed_at
     * @param bool|null $isRegistered
     * @param string|null $lastBuildTime
     * @param array|null $lastBuildFileSnapshots
     * @return bool
     */
    public function define($description, $status, $date, $parent_id = null, $slug = null, $title = null, $icon = null, $attributes = null, $version = '1.0.0', $completed_at = null, $isRegistered = null, $lastBuildTime = null, $lastBuildFileSnapshots = null)
    {
        // Create the definition array
        $definition = [
            'id'            => $this->block_id,
            'description'   => $description,
            'status'        => $status,
            'date'          => $date,
            'parent_id'     => $parent_id,
            'version'       => $version
        ];

        // Add optional fields
        if ( $slug !== null ) {
            $definition['slug'] = $slug;
        }

        if ( $title !== null ) {
            $definition['title'] = $title;
        }

        if ( $icon !== null ) {
            $definition['icon'] = $icon;
        }

        if ( $attributes !== null ) {
            $definition['attributes'] = $attributes;
        }

        if ( $version !== null ) {
            $definition['version'] = $version;
        }

        if ( $completed_at !== null ) {
            $definition['completed_at'] = $completed_at;
        }

        if ( $isRegistered !== null ) {
            $definition['isRegistered'] = $isRegistered;
        }

        if ( $lastBuildTime !== null ) {
            $definition['lastBuildTime'] = $lastBuildTime;
        }

        if ( $lastBuildFileSnapshots !== null ) {
            $definition['lastBuildFileSnapshots'] = $lastBuildFileSnapshots;
        }

        // Write the definition file
        $json_content = wp_json_encode($definition, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        if ($json_content === false) {
            return false;
        }

        if (!$this->make_file(self::BLOCKS_DEFINITION_FILE, $json_content)) {
            return false;
        }

        return true;
    }

    /**
     * Gets the definition for the block
     * @return array|false
     */
    public function get_definition()
    {
        if (!$this->file_exists(self::BLOCKS_DEFINITION_FILE)) {
            return false;
        }

        $file_content = $this->read_file(self::BLOCKS_DEFINITION_FILE);
        if ($file_content === false) {
            return false;
        }

        $definition = json_decode($file_content, true);
        if ($definition === null) {
            return false;
        }

        return $definition;
    }

    /**
     * Writes the file tree for the block
     * @param \SuggerenceBlocks\Entities\FileNode[] $file_tree
     * @return bool
     */
    public function write_files( $files )
    {
        foreach ( $files as $file ) {

            // Skip files with no path
            if ( empty( $file->get_path() ) ) {
                continue;
            }

            // Remove leading './' from the path
            $clean_path = preg_replace( '/^\.\//', '', $file->get_path() );

            // Extract directory path from file path
            $last_slash_pos = strrpos( $clean_path, '/' );
            if ( $last_slash_pos !== false ) {
                $dir_path = substr( $clean_path, 0, $last_slash_pos );
                
                // Create directory structure if needed
                if ( !empty( $dir_path ) && !$this->file_exists( $dir_path ) ) {
                    if ( !$this->make_folder( $dir_path ) ) {
                        return false;
                    }
                }
            }

            // Write the file
            if ( !$this->make_file( $clean_path, $file->get_file()->get_content() ) ) {
                return false;
            }
        }

        return true;
    }

    /**
     * Deletes this block and all its files
     * 
     * @return bool
     */
    public function delete()
    {
        return $this->delete_block_folder( $this->root() );
    }

    /**
     * Deletes a block's folder and all its files
     * 
     * @param string $directory
     * @return bool
     */
    public function delete_block_folder( $directory )
    {
        if ( !file_exists( $directory ) ) {
            return true;
        }

        if ( !is_dir( $directory ) ) {
            return unlink( $directory );
        }

        $files = array_diff( scandir( $directory ), [ '.', '..' ] );

        foreach ( $files as $file ) {
            $path = $directory . '/' . $file;

            if ( is_dir( $path ) ) {
                $result = $this->delete_block_folder( $path );

                if ( !$result ) {
                    return false;
                }
            }
            else {
                if ( !unlink( $path ) ) {
                    return false;
                }
            }
        }

        return rmdir( $directory );
    }
}
