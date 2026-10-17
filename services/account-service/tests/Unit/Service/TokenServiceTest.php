<?php

namespace App\Tests\Unit\Service;

use App\Entity\Session;
use App\Entity\User;
use App\Exception\InvalidRefreshTokenException;
use App\Repository\SessionRepository;
use App\Service\TokenService;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Clock\MockClock;

final class TokenServiceTest extends TestCase
{
    private const ACCESS_TOKEN_TTL = 900;

    private MockClock $clock;
    private User $user;

    protected function setUp(): void
    {
        $this->clock = new MockClock('2026-10-17 10:00:00');
        $this->user = new User('Alice', 'alice', 'alice@example.com');
    }

    public function testIssueReturnsJwtAndRandomRefreshToken(): void
    {
        $service = $this->createService();

        $pair = $service->issue($this->user);

        self::assertSame('signed.jwt.token', $pair->accessToken);
        self::assertSame(self::ACCESS_TOKEN_TTL, $pair->expiresIn);
        self::assertSame($this->user, $pair->user);
        self::assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $pair->refreshToken);
        self::assertNotSame($pair->refreshToken, $service->issue($this->user)->refreshToken);
    }

    public function testIssueStoresOnlyTheHashOfTheRefreshTokenWithSevenDaysLifetime(): void
    {
        $persisted = null;
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('persist')->willReturnCallback(function (Session $session) use (&$persisted): void {
            $persisted = $session;
        });
        $em->expects($this->once())->method('flush');

        $pair = $this->createService(em: $em)->issue($this->user);

        self::assertInstanceOf(Session::class, $persisted);
        self::assertSame($this->user, $persisted->getUser());
        self::assertSame(hash('sha256', $pair->refreshToken), $persisted->getRefreshTokenHash());
        self::assertEquals(new \DateTimeImmutable('2026-10-24 10:00:00'), $persisted->getExpiresAt());
    }

    public function testRefreshRotatesTheToken(): void
    {
        $session = $this->storedSession('old-token');

        $pair = $this->createService($this->repositoryReturning($session))->refresh('old-token');

        self::assertNotNull($session->getRevokedAt(), 'the presented refresh token must be revoked');
        self::assertNotSame('old-token', $pair->refreshToken);
        self::assertSame($this->user, $pair->user);
    }

    public function testRefreshRejectsUnknownToken(): void
    {
        $service = $this->createService($this->repositoryReturning(null));

        $this->expectException(InvalidRefreshTokenException::class);
        $service->refresh('unknown-token');
    }

    public function testRefreshRejectsExpiredToken(): void
    {
        $sessions = $this->createMock(SessionRepository::class);
        $sessions->method('findOneByRefreshTokenHash')->willReturn($this->storedSession('old-token'));
        $sessions->expects($this->never())->method('revokeAllForUser');
        $service = $this->createService($sessions);

        $this->clock->modify('+8 days');

        $this->expectException(InvalidRefreshTokenException::class);
        $service->refresh('old-token');
    }

    public function testReplayingARevokedTokenRevokesEverySessionOfTheUser(): void
    {
        $session = $this->storedSession('stolen-token');
        $session->revoke();
        $sessions = $this->createMock(SessionRepository::class);
        $sessions->method('findOneByRefreshTokenHash')->willReturn($session);
        $sessions->expects($this->once())->method('revokeAllForUser')->with($this->user);

        $this->expectException(InvalidRefreshTokenException::class);
        $this->createService($sessions)->refresh('stolen-token');
    }

    public function testRevokeMarksTheSessionAsRevoked(): void
    {
        $session = $this->storedSession('token');
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('flush');

        $this->createService($this->repositoryReturning($session), $em)->revoke('token');

        self::assertNotNull($session->getRevokedAt());
    }

    public function testRevokeIgnoresUnknownToken(): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('flush');

        $this->createService($this->repositoryReturning(null), $em)->revoke('unknown-token');
    }

    private function createService(?SessionRepository $sessions = null, ?EntityManagerInterface $em = null): TokenService
    {
        $jwtManager = $this->createStub(JWTTokenManagerInterface::class);
        $jwtManager->method('create')->willReturn('signed.jwt.token');

        return new TokenService(
            $jwtManager,
            $sessions ?? $this->createStub(SessionRepository::class),
            $em ?? $this->createStub(EntityManagerInterface::class),
            $this->clock,
            self::ACCESS_TOKEN_TTL,
        );
    }

    private function storedSession(string $refreshToken): Session
    {
        return new Session($this->user, hash('sha256', $refreshToken), $this->clock->now()->modify('+7 days'));
    }

    /**
     * Repository that only knows the given session, looked up by the hash of its refresh token.
     */
    private function repositoryReturning(?Session $session): SessionRepository
    {
        $sessions = $this->createStub(SessionRepository::class);
        $sessions->method('findOneByRefreshTokenHash')->willReturnCallback(
            fn (string $hash): ?Session => $session?->getRefreshTokenHash() === $hash ? $session : null,
        );

        return $sessions;
    }
}
