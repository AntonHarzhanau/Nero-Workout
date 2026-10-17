<?php

namespace App\Dto;

use App\Service\TokenPair;

final readonly class AuthResponse
{
    public function __construct(
        public string $accessToken,
        public string $refreshToken,
        public int $expiresIn,
        public UserResponse $user,
    ) {
    }

    public static function fromTokenPair(TokenPair $pair): self
    {
        return new self(
            $pair->accessToken,
            $pair->refreshToken,
            $pair->expiresIn,
            UserResponse::fromEntity($pair->user),
        );
    }
}
