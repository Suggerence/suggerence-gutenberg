<?php

namespace SuggerenceGutenberg\Entities;

class FileNode extends Node
{
    private $file;

    /**
     * Constructor
     * @param string $name
     * @param string $path
     * @param File $file
     */
    public function __construct( $name, $path, $file )
    {
        parent::__construct( self::TYPE_FILE, $name, $path );
        
        $this->file = $file;
    }

    /**
     * Returns the file
     * @return File
     */
    public function get_file()
    {
        return $this->file;
    }

    /**
     * Converts the file node to an array
     * @return array
     */
    public function to_array()
    {
        return array_merge( parent::to_array(), [
            'content' => $this->file->get_content(),
            'path' => $this->file->get_path(),
            'filename' => $this->file->get_filename(),
            'extension' => $this->file->get_extension(),
            'status' => $this->file->get_status(),
        ] );
    }
}
