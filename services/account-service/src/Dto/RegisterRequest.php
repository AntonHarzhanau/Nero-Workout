<?php

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Surrounding whitespace is ignored by the validators ("normalizer: trim") and stripped by the User entity.
 */
final readonly class RegisterRequest
{
    public function __construct(
        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(max: 100, normalizer: 'trim')]
        public string $name = '',

        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Length(min: 3, max: 32, normalizer: 'trim')]
        #[Assert\Regex(pattern: '/^[a-zA-Z0-9_.-]+$/', message: 'Only letters, digits, ".", "_" and "-" are allowed.', normalizer: 'trim')]
        public string $username = '',

        #[Assert\NotBlank(normalizer: 'trim')]
        #[Assert\Email(normalizer: 'trim')]
        #[Assert\Length(max: 254, normalizer: 'trim')]
        public string $email = '',

        // Upper bound prevents hashing huge payloads (DoS)
        #[Assert\NotBlank]
        #[Assert\Length(min: 8, max: 4096)]
        public string $password = '',
    ) {
    }
}
