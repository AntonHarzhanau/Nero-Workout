<?php

namespace App\Tests\Unit\Client;

use App\Client\WorkoutServiceClient;
use App\Exception\UserDataCleanupFailedException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;
use Symfony\Component\Uid\Uuid;

final class WorkoutServiceClientTest extends TestCase
{
    public function testSendsAnAuthenticatedDeleteRequest(): void
    {
        $userId = Uuid::v7();
        $request = null;
        $http = new MockHttpClient(function (string $method, string $url, array $options) use (&$request): MockResponse {
            $request = [$method, $url, $options['normalized_headers']['x-internal-token'][0] ?? null];

            return new MockResponse('', ['http_code' => 204]);
        });

        $this->client($http, 'http://workout-service:3001/')->deleteUserData($userId);

        self::assertSame(
            ['DELETE', 'http://workout-service:3001/internal/users/'.$userId->toRfc4122(), 'X-Internal-Token: s3cr3t'],
            $request,
        );
    }

    /**
     * @return iterable<string, array{MockResponse}>
     */
    public static function failingResponses(): iterable
    {
        yield 'server error' => [new MockResponse('', ['http_code' => 500])];
        yield 'not found' => [new MockResponse('', ['http_code' => 404])];
        yield 'forbidden (wrong token)' => [new MockResponse('', ['http_code' => 403])];
        yield 'unauthorized' => [new MockResponse('', ['http_code' => 401])];
        yield 'network error' => [new MockResponse('', ['error' => 'Could not resolve host: workout-service'])];
    }

    #[DataProvider('failingResponses')]
    public function testFailureIsReported(MockResponse $response): void
    {
        $this->expectException(UserDataCleanupFailedException::class);

        $this->client(new MockHttpClient($response), 'http://workout-service:3001')->deleteUserData(Uuid::v7());
    }

    public static function missingServiceUrls(): iterable
    {
        yield 'empty' => [''];
        yield 'whitespace' => [" \t\n"];
    }

    #[DataProvider('missingServiceUrls')]
    public function testMissingServiceUrlFailsWithoutSendingARequest(string $baseUrl): void
    {
        $http = new MockHttpClient(function (): never {
            self::fail('No request must be sent');
        });

        $this->expectException(UserDataCleanupFailedException::class);

        try {
            $this->client($http, $baseUrl)->deleteUserData(Uuid::v7());
        } finally {
            self::assertSame(0, $http->getRequestsCount());
        }
    }

    private function client(MockHttpClient $http, string $baseUrl): WorkoutServiceClient
    {
        return new WorkoutServiceClient($http, new NullLogger(), $baseUrl, 's3cr3t');
    }
}
