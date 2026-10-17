<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

final readonly class LoginRequest
{
    public function __construct(
        #[Assert\NotBlank]
        #[Assert\Length(max: 254)]
        public string $email = '',

        #[Assert\NotBlank]
        #[Assert\Length(max: 4096)]
        public string $password = '',
    ) {
    }
}
