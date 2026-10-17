<?php

namespace App\Exception;

final class UserDataCleanupFailedException extends \RuntimeException
{
    public function __construct(string $service, ?\Throwable $previous = null)
    {
        parent::__construct(sprintf('The user data could not be deleted from %s; the account was kept.', $service), previous: $previous);
    }
}
