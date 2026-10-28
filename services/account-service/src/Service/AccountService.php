<?php

namespace App\Service;

use App\Client\WorkoutServiceClient;
use App\Dto\RegisterRequest;
use App\Entity\User;
use App\Entity\UserRole;
use App\Exception\AccountAlreadyExistsException;
use App\Exception\UserDataCleanupFailedException;
use App\Repository\UserRepository;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AccountService
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly WorkoutServiceClient $workoutService,
    ) {
    }

    /**
     * @throws AccountAlreadyExistsException
     */
    public function register(RegisterRequest $request, UserRole $role = UserRole::Standard): User
    {
        $user = new User($request->name, $request->username, $request->email);
        $user->setRole($role);

        if (null !== $this->users->findOneBy(['email' => $user->getEmail()])) {
            throw new AccountAlreadyExistsException('email');
        }
        if (null !== $this->users->findOneBy(['username' => $user->getUsername()])) {
            throw new AccountAlreadyExistsException('username');
        }

        $user->setPassword($this->passwordHasher->hashPassword($user, $request->password));

        $this->em->persist($user);

        try {
            $this->em->flush();
        } catch (UniqueConstraintViolationException $e) {
            throw new AccountAlreadyExistsException(str_contains($e->getMessage(), 'uniq_users_username') ? 'username' : 'email');
        }

        return $user;
    }

    /**
     * @throws UserDataCleanupFailedException
     */
    public function delete(User $user): void
    {
        $this->workoutService->deleteUserData($user->getId());

        $this->em->remove($user);
        $this->em->flush();
    }

    public function hasAdmin(): bool
    {
        return $this->users->count(['role' => UserRole::Admin]) > 0;
    }

    /**
     * @return list<User>
     */
    public function listAll(): array
    {
        return $this->users->findBy([], ['createdAt' => 'ASC']);
    }
}
