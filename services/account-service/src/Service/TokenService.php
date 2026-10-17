<?php

namespace App\Service;

use App\Entity\Session;
use App\Entity\User;
use App\Exception\InvalidRefreshTokenException;
use App\Repository\SessionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Psr\Clock\ClockInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

class TokenService
{
    private const REFRESH_TOKEN_TTL = '+7 days';

    public function __construct(
        private readonly JWTTokenManagerInterface $jwtManager,
        private readonly SessionRepository $sessions,
        private readonly EntityManagerInterface $em,
        private readonly ClockInterface $clock,
        #[Autowire('%lexik_jwt_authentication.token_ttl%')]
        private readonly int $accessTokenTtl,
    ) {
    }


    public function issue(User $user): TokenPair
    {
        $refreshToken = bin2hex(random_bytes(32));
        $expiresAt = $this->clock->now()->modify(self::REFRESH_TOKEN_TTL);

        $this->em->persist(new Session($user, self::hash($refreshToken), $expiresAt));
        $this->em->flush();

        return new TokenPair($this->jwtManager->create($user), $refreshToken, $this->accessTokenTtl, $user);
    }


    public function refresh(string $refreshToken): TokenPair
    {
        $session = $this->sessions->findOneByRefreshTokenHash(self::hash($refreshToken));

        if (null === $session) {
            throw new InvalidRefreshTokenException();
        }

        if (null !== $session->getRevokedAt()) {
            $this->sessions->revokeAllForUser($session->getUser());

            throw new InvalidRefreshTokenException();
        }

        if (!$session->isActive($this->clock->now())) {
            throw new InvalidRefreshTokenException();
        }

        $session->revoke();

        return $this->issue($session->getUser());
    }

    public function revoke(string $refreshToken): void
    {
        $session = $this->sessions->findOneByRefreshTokenHash(self::hash($refreshToken));

        if (null === $session) {
            return;
        }

        $session->revoke();
        $this->em->flush();
    }

    private static function hash(string $refreshToken): string
    {
        return hash('sha256', $refreshToken);
    }
}
