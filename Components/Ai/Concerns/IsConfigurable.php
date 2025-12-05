<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

trait IsConfigurable
{
    public function configuration()
    {
        $providerName = strtolower(class_basename($this));

        $configuration = get_option("suggerence_{$providerName}_config", []);

        foreach ($configuration as $name => $value) {
            if (in_array($name, $this->sensitiveParameters())) {
                $configuration[$name] = str_repeat('*', strlen($value));
            }
        }

        return $configuration;
    }
}
