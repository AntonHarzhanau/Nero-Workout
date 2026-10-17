<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class RefreshTokenRequest
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 255)]
        public string $refreshToken = '',
    ) {
    }
}
