<?php

namespace App\EventListener;

use App\Entity\User;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;


#[AsEventListener(event: Events::JWT_CREATED)]
final class JwtCreatedListener
{
    public function __invoke(JWTCreatedEvent $event): void
    {
        $user = $event->getUser();
        if (!$user instanceof User) {
            return;
        }

        $payload = $event->getData();
        unset($payload['roles']);

        $payload['role'] = $user->getRole()->value;
        $payload['iss'] = 'account-service';
        $payload['aud'] = 'nero';

        $event->setData($payload);
    }
}
