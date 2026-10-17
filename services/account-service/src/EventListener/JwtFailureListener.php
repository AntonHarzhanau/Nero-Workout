<?php

namespace App\EventListener;

use App\Http\ApiErrorResponse;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTExpiredEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTInvalidEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTNotFoundEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Events;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\Response;

/**
 * Aligns the bundle's 401 responses with the API error format.
 */
final class JwtFailureListener
{
    #[AsEventListener(event: Events::JWT_NOT_FOUND)]
    public function onNotFound(JWTNotFoundEvent $event): void
    {
        $event->setResponse($this->unauthorized('missing_token', 'Authentication is required.'));
    }

    #[AsEventListener(event: Events::JWT_EXPIRED)]
    public function onExpired(JWTExpiredEvent $event): void
    {
        $event->setResponse($this->unauthorized('expired_token', 'The access token has expired.'));
    }

    #[AsEventListener(event: Events::JWT_INVALID)]
    public function onInvalid(JWTInvalidEvent $event): void
    {
        $event->setResponse($this->unauthorized('invalid_token', 'The access token is invalid.'));
    }

    private function unauthorized(string $error, string $message): ApiErrorResponse
    {
        return new ApiErrorResponse(Response::HTTP_UNAUTHORIZED, $error, $message, headers: ['WWW-Authenticate' => 'Bearer']);
    }
}
