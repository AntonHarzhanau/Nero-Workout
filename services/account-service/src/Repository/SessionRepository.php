<?php

namespace App\Repository;

use App\Entity\Session;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class SessionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Session::class); 
    }

    public function findOneByRefreshTokenHash(string $hash): ?Session
    {
        return $this->findOneBy(['refreshTokenHash' => $hash]);
    }

    public function revokeAllForUser(User $user): void
    {
        $this->createQueryBuilder('s')
            ->update()
            ->set('s.revokedAt', ':now')
            ->where('s.user = :user')
            ->andWhere('s.revokedAt IS NULL')
            ->setParameter('now', new \DateTimeImmutable(), 'datetimetz_immutable')
            ->setParameter('user', $user)
            ->getQuery()
            ->execute();
    }
}
