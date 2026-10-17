<?php

namespace App\Service;

use App\Entity\User;
use App\Exception\InvalidCredentialsException;
use App\Repository\UserRepository;
use Symfony\Component\PasswordHasher\Hasher\PasswordHasherFactoryInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AuthenticationService
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly PasswordHasherFactoryInterface $hasherFactory,
        private readonly TokenService $tokens,
    ) {
    }

    /**
     * @throws InvalidCredentialsException
     */
    public function login(string $email, string $password): TokenPair
    {
        $user = $this->users->findOneBy(['email' => mb_strtolower(trim($email))]);

        if (null === $user) {
            // Hash anyway so that response time does not reveal whether the email exists
            $this->hasherFactory->getPasswordHasher(User::class)->hash($password);

            throw new InvalidCredentialsException();
        }

        if (!$this->passwordHasher->isPasswordValid($user, $password)) {
            throw new InvalidCredentialsException();
        }

        if ($this->passwordHasher->needsRehash($user)) {
            $this->users->upgradePassword($user, $this->passwordHasher->hashPassword($user, $password));
        }

        return $this->tokens->issue($user);
    }
}
