<?php

namespace SuggerenceGutenberg\Entities;

class File
{
    private $content;
    private $path;
    private $filename;
    private $extension;
    private $status;

    /**
     * Constructor
     * 
     * @param string $content
     * @param string $path
     * @param string $filename
     * @param string $extension
     * @param string $status
     */
    public function __construct( $content, $path, $filename, $extension, $status = 'completed' )
    {
        $this->content      = $content;
        $this->path         = $path;
        $this->filename     = $filename;
        $this->extension    = $extension;
        $this->status       = $status;
    }

    /**
     * Returns the content of the file
     * @return string
     */
    public function get_content()
    {
        return $this->content;
    }
    
    /**
     * Returns the path of the file
     * @return string
     */
    public function get_path()
    {
        return $this->path;
    }
    
    /**
     * Returns the filename of the file
     * @return string
     */
    public function get_filename()
    {
        return $this->filename;
    }
    
    /**
     * Returns the extension of the file
     * @return string
     */
    public function get_extension()
    {
        return $this->extension;
    }
    
    /**
     * Returns the status of the file
     * @return string
     */
    public function get_status()
    {
        return $this->status;
    }
}
