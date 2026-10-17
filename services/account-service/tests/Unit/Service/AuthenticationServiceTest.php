<?php

namespace App\Tests\Unit\Service;

use App\Entity\User;
use App\Exception\InvalidCredentialsException;
use App\Repository\UserRepository;
use App\Service\AuthenticationService;
use App\Service\TokenPair;
use App\Service\TokenService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\PasswordHasherFactoryInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\PasswordHasher\PasswordHasherInterface;

final class AuthenticationServiceTest extends TestCase
{
    private User $user;

    protected function setUp(): void
    {
        $this->user = new User('Alice', 'alice', 'alice@example.com');
    }

    public function testLoginWithValidCredentialsIssuesTokens(): void
    {
        $pair = new TokenPair('jwt', 'refresh', 900, $this->user);
        $tokens = $this->createMock(TokenService::class);
        $tokens->expects($this->once())->method('issue')->with($this->user)->willReturn($pair);

        $service = $this->createService(
            users: $this->repositoryFinding($this->user),
            passwordHasher: $this->passwordHasher(valid: true),
            tokens: $tokens,
        );

        self::assertSame($pair, $service->login('alice@example.com', 'secret123'));
    }

    public function testEmailIsLookedUpTrimmedAndLowercased(): void
    {
        $users = $this->createMock(UserRepository::class);
        $users->expects($this->once())->method('findOneBy')->with(['email' => 'alice@example.com'])->willReturn($this->user);

        $this->createService(users: $users, passwordHasher: $this->passwordHasher(valid: true))
            ->login('  Alice@Example.COM ', 'secret123');
    }

    public function testWrongPasswordIsRejected(): void
    {
        $tokens = $this->createMock(TokenService::class);
        $tokens->expects($this->never())->method('issue');

        $service = $this->createService(
            users: $this->repositoryFinding($this->user),
            passwordHasher: $this->passwordHasher(valid: false),
            tokens: $tokens,
        );

        $this->expectException(InvalidCredentialsException::class);
        $service->login('alice@example.com', 'wrong-password');
    }

    public function testUnknownEmailIsRejectedAfterHashingAnyway(): void
    {
        $hasher = $this->createMock(PasswordHasherInterface::class);
        $hasher->expects($this->once())->method('hash')->with('secret123');
        $factory = $this->createStub(PasswordHasherFactoryInterface::class);
        $factory->method('getPasswordHasher')->willReturn($hasher);

        $service = $this->createService(users: $this->repositoryFinding(null), hasherFactory: $factory);

        $this->expectException(InvalidCredentialsException::class);
        $service->login('ghost@example.com', 'secret123');
    }

    public function testOutdatedPasswordHashIsUpgradedOnLogin(): void
    {
        $passwordHasher = $this->passwordHasher(valid: true, needsRehash: true);
        $passwordHasher->method('hashPassword')->willReturn('new-hash');
        $users = $this->createMock(UserRepository::class);
        $users->method('findOneBy')->willReturn($this->user);
        $users->expects($this->once())->method('upgradePassword')->with($this->user, 'new-hash');

        $this->createService(users: $users, passwordHasher: $passwordHasher)->login('alice@example.com', 'secret123');
    }

    private function createService(
        ?UserRepository $users = null,
        ?UserPasswordHasherInterface $passwordHasher = null,
        ?PasswordHasherFactoryInterface $hasherFactory = null,
        ?TokenService $tokens = null,
    ): AuthenticationService {
        if (null === $tokens) {
            $tokens = $this->createStub(TokenService::class);
            $tokens->method('issue')->willReturn(new TokenPair('jwt', 'refresh', 900, $this->user));
        }

        return new AuthenticationService(
            $users ?? $this->createStub(UserRepository::class),
            $passwordHasher ?? $this->createStub(UserPasswordHasherInterface::class),
            $hasherFactory ?? $this->createStub(PasswordHasherFactoryInterface::class),
            $tokens,
        );
    }

    private function repositoryFinding(?User $user): UserRepository
    {
        $users = $this->createStub(UserRepository::class);
        $users->method('findOneBy')->willReturn($user);

        return $users;
    }

    private function passwordHasher(bool $valid, bool $needsRehash = false): UserPasswordHasherInterface
    {
        $hasher = $this->createStub(UserPasswordHasherInterface::class);
        $hasher->method('isPasswordValid')->willReturn($valid);
        $hasher->method('needsRehash')->willReturn($needsRehash);

        return $hasher;
    }
}
