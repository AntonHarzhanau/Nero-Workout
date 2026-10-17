<?php

namespace App\Client;

use App\Exception\UserDataCleanupFailedException;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Uid\Uuid;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;


class WorkoutServiceClient
{
    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly LoggerInterface $logger,
        #[Autowire(env: 'WORKOUT_SERVICE_URL')]
        private readonly string $baseUrl,
        #[Autowire(env: 'trim:file:INTERNAL_API_TOKEN_FILE')]
        #[\SensitiveParameter]
        private readonly string $internalToken,
    ) {
    }

    /**
     * @throws UserDataCleanupFailedException
     */
    public function deleteUserData(Uuid $userId): void
    {
        if ('' === $this->baseUrl) {
            $this->logger->warning('WORKOUT_SERVICE_URL is not set: workout data of user {id} was not deleted.', ['id' => $userId->toRfc4122()]);

            return;
        }

        try {
            $response = $this->httpClient->request('DELETE', rtrim($this->baseUrl, '/').'/internal/users/'.$userId->toRfc4122(), [
                'headers' => ['X-Internal-Token' => $this->internalToken],
                'timeout' => 3,
                'max_duration' => 5,
            ]);
            $status = $response->getStatusCode();
        } catch (TransportExceptionInterface $e) {
            throw new UserDataCleanupFailedException('workout-service', $e);
        }

        if ($status < 200 || $status >= 300) {
            $this->logger->error('workout-service answered {status} when deleting data of user {id}.', ['status' => $status, 'id' => $userId->toRfc4122()]);

            throw new UserDataCleanupFailedException('workout-service');
        }
    }
}
