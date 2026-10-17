<?php

namespace App\Exception;

final class AccountAlreadyExistsException extends \RuntimeException
{
    /**
     * @param 'email'|'username' $field
     */
    public function __construct(public readonly string $field)
    {
        parent::__construct(sprintf('This %s is already used by another account.', $field));
    }
}
