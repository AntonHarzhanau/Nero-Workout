<?php

namespace App\EventListener;

use App\Exception\AccountAlreadyExistsException;
use App\Exception\InvalidCredentialsException;
use App\Exception\InvalidRefreshTokenException;
use App\Exception\UserDataCleanupFailedException;
use App\Http\ApiErrorResponse;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Validator\Exception\ValidationFailedException;


#[AsEventListener(priority: -64)]
final class ApiExceptionListener
{
    public function __construct(
        #[Autowire('%kernel.debug%')]
        private readonly bool $debug,
    ) {
    }

    public function __invoke(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        $response = match (true) {
            $exception instanceof AccountAlreadyExistsException => new ApiErrorResponse(
                Response::HTTP_CONFLICT,
                'account_already_exists',
                $exception->getMessage(),
                [$exception->field => $exception->getMessage()],
            ),
            $exception instanceof InvalidCredentialsException => new ApiErrorResponse(
                Response::HTTP_UNAUTHORIZED,
                'invalid_credentials',
                $exception->getMessage(),
            ),
            $exception instanceof InvalidRefreshTokenException => new ApiErrorResponse(
                Response::HTTP_UNAUTHORIZED,
                'invalid_refresh_token',
                $exception->getMessage(),
            ),
            $exception instanceof UserDataCleanupFailedException => new ApiErrorResponse(
                Response::HTTP_BAD_GATEWAY,
                'dependency_unavailable',
                $exception->getMessage(),
            ),
            $exception instanceof HttpExceptionInterface => $this->fromHttpException($exception),
            // Unexpected error: keep Symfony's debug page in dev, never leak internals otherwise
            $this->debug => null,
            default => new ApiErrorResponse(
                Response::HTTP_INTERNAL_SERVER_ERROR,
                'internal_error',
                'An unexpected error occurred.',
            ),
        };

        if (null !== $response) {
            $event->setResponse($response);
        }
    }

    private function fromHttpException(HttpExceptionInterface $exception): ApiErrorResponse
    {
        $status = $exception->getStatusCode();
        $previous = $exception->getPrevious();

        if ($previous instanceof ValidationFailedException) {
            $details = [];
            foreach ($previous->getViolations() as $violation) {
                $details[$violation->getPropertyPath()] ??= (string) $violation->getMessage();
            }

            return new ApiErrorResponse($status, 'validation_failed', 'The request contains invalid data.', $details);
        }

        $statusText = Response::$statusTexts[$status] ?? 'Error';

        return new ApiErrorResponse(
            $status,
            strtolower(preg_replace('/\W+/', '_', $statusText)),
            $status >= 500 ? 'An unexpected error occurred.' : $statusText.'.',
            headers: $exception->getHeaders(),
        );
    }
}
