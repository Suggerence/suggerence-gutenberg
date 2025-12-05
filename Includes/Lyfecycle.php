<?php

namespace SuggerenceGutenberg\Includes;

class Lyfecycle
{
    public static function activate($network_wide)
    {
        do_action('SuggerenceGutenberg/setup', $network_wide);
    }

    public static function deactivate($network_wide)
    {
        do_action('SuggerenceGutenberg/deactivation', $network_wide);
    }

    public static function uninstall()
    {
        do_action('SuggerenceGutenberg/cleanup');
    }
}
