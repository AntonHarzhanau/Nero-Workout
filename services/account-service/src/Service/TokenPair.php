<?php

namespace App\Service;

use App\Entity\User;

final readonly class TokenPair
{
    public function __construct(
        public string $accessToken,
        public string $refreshToken,
        public int $expiresIn,
        public User $user,
    ) {
    }
}
