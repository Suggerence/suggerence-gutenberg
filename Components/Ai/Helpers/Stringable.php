<?php

namespace SuggerenceGutenberg\Components\Ai\Helpers;

class Stringable
{
    /**
     * The underlying string value.
     */
    protected $value;

    /**
     * Create a new string instance.
     */
    public function __construct($value = '')
    {
        $this->value = (string) $value;
    }

    /**
     * Convert the string to snake_case.
     */
    public function snake($delimiter = '_')
    {
        return new static(Str::snake($this->value, $delimiter));
    }

    /**
     * Convert the string to camelCase.
     */
    public function camel()
    {
        return new static(Str::camel($this->value));
    }

    /**
     * Convert the string to StudlyCase.
     */
    public function studly()
    {
        return new static(Str::studly($this->value));
    }

    /**
     * Convert the string to lowercase.
     */
    public function lower()
    {
        return new static(Str::lower($this->value));
    }

    /**
     * Convert the string to uppercase.
     */
    public function upper()
    {
        return new static(Str::upper($this->value));
    }

    /**
     * Convert the string to title case.
     */
    public function title()
    {
        return new static(Str::title($this->value));
    }

    /**
     * Generate a URL friendly "slug" from the string.
     */
    public function slug($separator = '-', $language = 'en')
    {
        return new static(Str::slug($this->value, $separator, $language));
    }

    /**
     * Transliterate the string to ASCII.
     */
    public function ascii($language = 'en')
    {
        return new static(Str::ascii($this->value, $language));
    }

    /**
     * Determine if the string starts with a given substring.
     */
    public function startsWith($needles)
    {
        return Str::startsWith($this->value, $needles);
    }

    /**
     * Determine if the string ends with a given substring.
     */
    public function endsWith($needles)
    {
        return Str::endsWith($this->value, $needles);
    }

    /**
     * Determine if the string contains a given substring.
     */
    public function contains($needles)
    {
        return Str::contains($this->value, $needles);
    }

    /**
     * Replace the first occurrence of a given value in the string.
     */
    public function replaceFirst($search, $replace)
    {
        return new static(Str::replaceFirst($search, $replace, $this->value));
    }

    /**
     * Replace the last occurrence of a given value in the string.
     */
    public function replaceLast($search, $replace)
    {
        return new static(Str::replaceLast($search, $replace, $this->value));
    }

    /**
     * Begin the string with a single instance of a given value.
     */
    public function start($prefix)
    {
        return new static(Str::start($this->value, $prefix));
    }

    /**
     * Cap the string with a single instance of a given value.
     */
    public function finish($cap)
    {
        return new static(Str::finish($this->value, $cap));
    }

    /**
     * Determine if the string matches a given pattern.
     */
    public function is($pattern)
    {
        return Str::is($pattern, $this->value);
    }

    /**
     * Get the portion of the string before the first occurrence of a given value.
     */
    public function before($search)
    {
        return new static(Str::before($this->value, $search));
    }

    /**
     * Get the portion of the string after the first occurrence of a given value.
     */
    public function after($search)
    {
        return new static(Str::after($this->value, $search));
    }

    /**
     * Get the portion of the string before the last occurrence of a given value.
     */
    public function beforeLast($search)
    {
        return new static(Str::beforeLast($this->value, $search));
    }

    /**
     * Get the portion of the string after the last occurrence of a given value.
     */
    public function afterLast($search)
    {
        return new static(Str::afterLast($this->value, $search));
    }

    /**
     * Get the portion of the string between two given values.
     */
    public function between($from, $to)
    {
        return new static(Str::between($this->value, $from, $to));
    }

    /**
     * Get the length of the string.
     */
    public function length($encoding = null)
    {
        return Str::length($this->value, $encoding);
    }

    /**
     * Limit the number of characters in the string.
     */
    public function limit($limit = 100, $end = '...')
    {
        return new static(Str::limit($this->value, $limit, $end));
    }

    /**
     * Make the first character of the string uppercase.
     */
    public function ucfirst()
    {
        return new static(Str::ucfirst($this->value));
    }

    /**
     * Get a substring of the string.
     */
    public function substr($start, $length = null)
    {
        return new static(Str::substr($this->value, $start, $length));
    }

    /**
     * Trim the string.
     */
    public function trim($characters = null)
    {
        return new static(trim($this->value, $characters));
    }

    /**
     * Left trim the string.
     */
    public function ltrim($characters = null)
    {
        return new static(ltrim($this->value, $characters));
    }

    /**
     * Right trim the string.
     */
    public function rtrim($characters = null)
    {
        return new static(rtrim($this->value, $characters));
    }

    /**
     * Split the string by a delimiter.
     */
    public function explode($delimiter, $limit = PHP_INT_MAX)
    {
        return explode($delimiter, $this->value, $limit);
    }

    /**
     * Replace all occurrences of the search string with the replacement string.
     */
    public function replace($search, $replace)
    {
        return new static(str_replace($search, $replace, $this->value));
    }

    /**
     * Replace all occurrences of the search string with the replacement string (case-insensitive).
     */
    public function replacei($search, $replace)
    {
        return new static(str_ireplace($search, $replace, $this->value));
    }

    /**
     * Append the given values to the string.
     */
    public function append(...$values)
    {
        return new static($this->value . implode('', $values));
    }

    /**
     * Prepend the given values to the string.
     */
    public function prepend(...$values)
    {
        return new static(implode('', $values) . $this->value);
    }

    /**
     * Determine if the string is empty.
     */
    public function isEmpty()
    {
        return $this->value === '';
    }

    /**
     * Determine if the string is not empty.
     */
    public function isNotEmpty()
    {
        return $this->value !== '';
    }

    /**
     * Convert the string to an array.
     */
    public function toArray()
    {
        return str_split($this->value);
    }

    /**
     * Get the string value.
     */
    public function toString()
    {
        return $this->value;
    }

    /**
     * Convert the object to a string.
     */
    public function __toString()
    {
        return $this->value;
    }
}
