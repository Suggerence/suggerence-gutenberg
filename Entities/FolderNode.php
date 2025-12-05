<?php

namespace SuggerenceGutenberg\Entities;

class FolderNode extends Node
{
    private $children;

    /**
     * Constructor
     * @param string $name
     * @param string $path
     * @param Node[] $children
     */
    public function __construct( $name, $path, $children )
    {
        parent::__construct( self::TYPE_FOLDER, $name, $path );

        $this->children = $children;
    }

    /**
     * Returns the children
     * @return Node[]
     */
    public function get_children()
    {
        return $this->children;
    }

    /**
     * Converts the folder node to an array
     * @return array
     */
    public function to_array()
    {
        return array_merge( parent::to_array(), [
            'children' => array_map( function( $child ) { return $child->to_array(); }, $this->children )
        ] );
    }
}
