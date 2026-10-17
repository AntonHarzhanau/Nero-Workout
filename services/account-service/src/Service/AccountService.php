<?php

namespace App\Service;

use App\Dto\RegisterRequest;
use App\Entity\User;
use App\Exception\AccountAlreadyExistsException;
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
    ) {
    }

    /**
     * @throws AccountAlreadyExistsException
     */
    public function register(RegisterRequest $request): User
    {
        $user = new User($request->name, $request->username, $request->email);

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
            // Two concurrent registrations passed the checks above: the unique index decides
            throw new AccountAlreadyExistsException(str_contains($e->getMessage(), 'uniq_users_username') ? 'username' : 'email');
        }

        return $user;
    }
}
