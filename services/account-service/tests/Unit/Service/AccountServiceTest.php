<?php

namespace App\Tests\Unit\Service;

use App\Client\WorkoutServiceClient;
use App\Dto\RegisterRequest;
use App\Entity\User;
use App\Entity\UserRole;
use App\Exception\AccountAlreadyExistsException;
use App\Exception\UserDataCleanupFailedException;
use App\Repository\UserRepository;
use App\Service\AccountService;
use Doctrine\DBAL\Driver\Exception as DriverException;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class AccountServiceTest extends TestCase
{
    public function testRegisterCreatesAStandardUserWithHashedPassword(): void
    {
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('persist')->with($this->isInstanceOf(User::class));
        $em->expects($this->once())->method('flush');

        $user = $this->createService(em: $em)->register($this->registerRequest());

        self::assertSame(UserRole::Standard, $user->getRole());
        self::assertSame('hashed-password', $user->getPassword());
        self::assertSame('alice@example.com', $user->getEmail());
    }

    public function testRegisterCanCreateAnAdmin(): void
    {
        $user = $this->createService()->register($this->registerRequest(), UserRole::Admin);

        self::assertTrue($user->isAdmin());
    }

    public function testRegisterRejectsTakenEmail(): void
    {
        $this->assertRegistrationConflictsOn('email', ['email' => 'alice@example.com']);
    }

    public function testRegisterRejectsTakenUsername(): void
    {
        $this->assertRegistrationConflictsOn('username', ['username' => 'alice']);
    }

    public function testConcurrentRegistrationCaughtByUniqueIndexIsAConflict(): void
    {
        $driverException = new class('duplicate key value violates unique constraint "uniq_users_username"') extends \Exception implements DriverException {
            public function getSQLState(): string
            {
                return '23505';
            }
        };
        $em = $this->createStub(EntityManagerInterface::class);
        $em->method('flush')->willThrowException(new UniqueConstraintViolationException($driverException, null));

        try {
            $this->createService(em: $em)->register($this->registerRequest());
            self::fail('AccountAlreadyExistsException expected');
        } catch (AccountAlreadyExistsException $e) {
            self::assertSame('username', $e->field);
        }
    }

    public function testDeleteRemovesWorkoutDataBeforeTheAccount(): void
    {
        $user = new User('Alice', 'alice', 'alice@example.com');
        $calls = [];

        $workout = $this->createMock(WorkoutServiceClient::class);
        $workout->expects($this->once())->method('deleteUserData')->with($user->getId())
            ->willReturnCallback(function () use (&$calls): void { $calls[] = 'workout'; });
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->once())->method('remove')->with($user)
            ->willReturnCallback(function () use (&$calls): void { $calls[] = 'remove'; });
        $em->expects($this->once())->method('flush');

        $this->createService(em: $em, workout: $workout)->delete($user);

        self::assertSame(['workout', 'remove'], $calls);
    }

    public function testAccountIsKeptWhenWorkoutDataCannotBeDeleted(): void
    {
        $workout = $this->createStub(WorkoutServiceClient::class);
        $workout->method('deleteUserData')->willThrowException(new UserDataCleanupFailedException('workout-service'));
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('remove');
        $em->expects($this->never())->method('flush');

        $this->expectException(UserDataCleanupFailedException::class);
        $this->createService(em: $em, workout: $workout)->delete(new User('Alice', 'alice', 'alice@example.com'));
    }

    public function testListAllReturnsUsersByCreationDate(): void
    {
        $users = $this->createMock(UserRepository::class);
        $users->expects($this->once())->method('findBy')->with([], ['createdAt' => 'ASC'])->willReturn([]);

        self::assertSame([], $this->createService(users: $users)->listAll());
    }

    /**
     * @param array<string, string> $takenCriteria criteria for which the repository finds an existing user
     */
    private function assertRegistrationConflictsOn(string $field, array $takenCriteria): void
    {
        $users = $this->createStub(UserRepository::class);
        $users->method('findOneBy')->willReturnCallback(
            fn (array $criteria): ?User => $criteria === $takenCriteria ? new User('Other', 'other', 'other@example.com') : null,
        );
        $em = $this->createMock(EntityManagerInterface::class);
        $em->expects($this->never())->method('persist');

        try {
            $this->createService(users: $users, em: $em)->register($this->registerRequest());
            self::fail('AccountAlreadyExistsException expected');
        } catch (AccountAlreadyExistsException $e) {
            self::assertSame($field, $e->field);
        }
    }

    private function createService(
        ?UserRepository $users = null,
        ?EntityManagerInterface $em = null,
        ?WorkoutServiceClient $workout = null,
    ): AccountService {
        $passwordHasher = $this->createStub(UserPasswordHasherInterface::class);
        $passwordHasher->method('hashPassword')->willReturn('hashed-password');

        return new AccountService(
            $users ?? $this->createStub(UserRepository::class),
            $em ?? $this->createStub(EntityManagerInterface::class),
            $passwordHasher,
            $workout ?? $this->createStub(WorkoutServiceClient::class),
        );
    }

    private function registerRequest(): RegisterRequest
    {
        return new RegisterRequest('Alice', 'alice', 'Alice@Example.com', 'secret123');
    }
}
