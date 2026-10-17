<?php

namespace App\Http;

use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Single error format for the whole API: { "error": "...", "message": "...", "details": {...} }.
 */
final class ApiErrorResponse extends JsonResponse
{
    /**
     * @param array<string, string>|null $details
     */
    public function __construct(int $status, string $error, string $message, ?array $details = null, array $headers = [])
    {
        $body = ['error' => $error, 'message' => $message];
        if (null !== $details) {
            $body['details'] = $details;
        }

        parent::__construct($body, $status, $headers);
    }
}
