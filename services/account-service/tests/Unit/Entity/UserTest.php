<?php

namespace App\Tests\Unit\Entity;

use App\Entity\User;
use App\Entity\UserRole;
use PHPUnit\Framework\TestCase;

final class UserTest extends TestCase
{
    public function testIdentityFieldsAreNormalized(): void
    {
        $user = new User('  Alice ', ' Alice_42 ', ' Alice@Example.COM ');

        self::assertSame('Alice', $user->getName());
        self::assertSame('alice_42', $user->getUsername());
        self::assertSame('alice@example.com', $user->getEmail());
    }

    public function testNewUserIsStandard(): void
    {
        $user = new User('Alice', 'alice', 'alice@example.com');

        self::assertSame(UserRole::Standard, $user->getRole());
        self::assertFalse($user->isAdmin());
        self::assertSame(['ROLE_USER'], $user->getRoles());
    }

    public function testAdminGetsTheAdminSecurityRole(): void
    {
        $user = (new User('Alice', 'alice', 'alice@example.com'))->setRole(UserRole::Admin);

        self::assertTrue($user->isAdmin());
        self::assertSame(['ROLE_ADMIN'], $user->getRoles());
    }

    public function testSecurityIdentifierIsTheUuidNotTheEmail(): void
    {
        $user = new User('Alice', 'alice', 'alice@example.com');

        self::assertSame($user->getId()->toRfc4122(), $user->getUserIdentifier());
    }
}
