<?php

namespace App\Entity;

enum UserRole: string
{
    case Standard = 'standard';
    case Admin = 'admin';

    public function toSecurityRole(): string
    {
        return match ($this) {
            self::Standard => 'ROLE_USER',
            self::Admin => 'ROLE_ADMIN',
        };
    }
}
