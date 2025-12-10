<?php

namespace SuggerenceGutenberg\Components;

class ApiKeyEncryption
{
    public const OPTION_NAME = 'suggerence_api_key';
    private const CIPHER = 'AES-256-CBC';

    public static function get(): string
    {
        $stored = get_option(self::OPTION_NAME, '');

        return is_string($stored) ? self::decrypt($stored) : '';
    }

    public static function save(string $value): bool
    {
        return update_option(self::OPTION_NAME, self::encrypt($value));
    }

    public static function remove(): bool
    {
        return delete_option(self::OPTION_NAME);
    }

    private static function encrypt(string $value): string
    {
        if ($value === '' || !self::canEncrypt()) {
            return $value;
        }

        $iv = random_bytes(openssl_cipher_iv_length(self::CIPHER));
        $encrypted = openssl_encrypt(
            $value,
            self::CIPHER,
            self::deriveKey(),
            OPENSSL_RAW_DATA,
            $iv
        );

        if ($encrypted === false) {
            return $value;
        }

        return base64_encode($iv . $encrypted);
    }

    private static function decrypt(string $value): string
    {
        if ($value === '' || !self::canEncrypt()) {
            return $value;
        }

        $decoded = base64_decode($value, true);
        if ($decoded === false) {
            return '';
        }

        $ivLength = openssl_cipher_iv_length(self::CIPHER);
        $iv = substr($decoded, 0, $ivLength);
        $cipherText = substr($decoded, $ivLength);

        $decrypted = openssl_decrypt(
            $cipherText,
            self::CIPHER,
            self::deriveKey(),
            OPENSSL_RAW_DATA,
            $iv
        );

        return $decrypted ?? '';
    }

    private static function deriveKey(): string
    {
        $keyMaterial = array_filter([
            defined('AUTH_KEY') ? AUTH_KEY : '',
            defined('SECURE_AUTH_KEY') ? SECURE_AUTH_KEY : '',
            defined('LOGGED_IN_KEY') ? LOGGED_IN_KEY : '',
            defined('NONCE_KEY') ? NONCE_KEY : '',
        ]);

        $salt = implode('', $keyMaterial);
        if ($salt === '') {
            $salt = SUGGERENCEGUTENBERG_NAME . SUGGERENCEGUTENBERG_VERSION;
        }

        return hash('sha256', $salt, true);
    }

    private static function canEncrypt(): bool
    {
        return function_exists('openssl_encrypt')
            && function_exists('openssl_decrypt')
            && defined('OPENSSL_RAW_DATA');
    }
}
