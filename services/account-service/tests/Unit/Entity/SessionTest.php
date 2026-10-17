<?php

namespace App\Tests\Unit\Entity;

use App\Entity\Session;
use App\Entity\User;
use PHPUnit\Framework\TestCase;

final class SessionTest extends TestCase
{
    private User $user;

    protected function setUp(): void
    {
        $this->user = new User('Alice', 'alice', 'alice@example.com');
    }

    public function testSessionIsActiveUntilItExpires(): void
    {
        $session = new Session($this->user, str_repeat('a', 64), new \DateTimeImmutable('2026-10-24 10:00:00'));

        self::assertTrue($session->isActive(new \DateTimeImmutable('2026-10-24 09:59:59')));
        self::assertFalse($session->isActive(new \DateTimeImmutable('2026-10-24 10:00:00')));
    }

    public function testRevokedSessionIsNoLongerActive(): void
    {
        $session = new Session($this->user, str_repeat('a', 64), new \DateTimeImmutable('+7 days'));

        $session->revoke();

        self::assertFalse($session->isActive());
    }

    public function testRevokeKeepsTheFirstRevocationDate(): void
    {
        $session = new Session($this->user, str_repeat('a', 64), new \DateTimeImmutable('+7 days'));
        $session->revoke();
        $firstRevocation = $session->getRevokedAt();

        $session->revoke();

        self::assertSame($firstRevocation, $session->getRevokedAt());
    }
}
