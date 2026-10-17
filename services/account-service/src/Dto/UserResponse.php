<?php

namespace App\Dto;

use App\Entity\User;

/**
 * Public representation of a user: never exposes the password hash.
 */
final readonly class UserResponse
{
    public function __construct(
        public string $id,
        public string $name,
        public string $username,
        public string $email,
        public string $role,
        public string $createdAt,
    ) {
    }

    public static function fromEntity(User $user): self
    {
        return new self(
            $user->getId()->toRfc4122(),
            $user->getName(),
            $user->getUsername(),
            $user->getEmail(),
            $user->getRole()->value,
            $user->getCreatedAt()->format(\DateTimeInterface::ATOM),
        );
    }
}
