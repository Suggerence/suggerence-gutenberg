<?php

namespace SuggerenceGutenberg\Components\Ai\Concerns;

use SuggerenceGutenberg\Components\Ai\Manager;

trait ConfiguresProviders
{
    protected $provider;

    protected $providerKey;

    protected $model;

    public function using($provider, $model, $providerConfig = [])
    {
        $this->providerKey = is_string( $provider ) ? $provider : $provider->value;

        $this->model = $model;

        return $this->usingProviderConfig( $providerConfig );
    }

    public function provider()
    {
        return $this->provider;
    }

    public function usingProviderConfig($config)
    {
        $this->provider = Manager::resolve($this->providerKey, $config);

        return $this;
    }

    public function model()
    {
        return $this->model;
    }

    public function providerKey()
    {
        return $this->providerKey;
    }

    public function whenProvider($provider, $callback)
    {
        $providerKey = is_string( $provider ) ? $provider : $provider->value;

        if ($this->providerKey() === $providerKey) {
            return $callback($this);
        }

        return $this;
    }
}
