<?php

namespace App\Service;

final readonly class TokenPair
{
    public function __construct(
        public string $accessToken,
        public string $refreshToken,
        public int $expiresIn,
    ) {
    }
}
