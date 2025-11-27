<?php

namespace SuggerenceGutenberg\Entities;

class Node
{
    public const TYPE_FILE = 'file';
    public const TYPE_FOLDER = 'folder';

    private $type;
    private $name;
    private $path;

    /**
     * Constructor
     * 
     * @param string $type
     * @param string $name
     * @param string $path
     */
    public function __construct( $type, $name, $path )
    {
        $this->type = $type;
        $this->name = $name;
        $this->path = $path;
    }

    /**
     * Returns the type of the node
     * @return string
     */
    public function get_type()
    {
        return $this->type;
    }

    /**
     * Returns the name of the node
     * @return string
     */
    public function get_name()
    {
        return $this->name;
    }

    /**
     * Returns the path of the node
     * @return string
     */
    public function get_path()
    {
        return $this->path;
    }

    /**
     * Converts the node to an array
     * @return array
     */
    public function to_array()
    {
        return [
            'type' => $this->type,
            'name' => $this->name,
            'path' => $this->path,
        ];
    }
}
