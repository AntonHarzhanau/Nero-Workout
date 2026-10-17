<?php

namespace App\Exception;

final class InvalidCredentialsException extends \RuntimeException
{
    public function __construct()
    {
        // Same message whether the email or the password is wrong: no account enumeration
        parent::__construct('Invalid email or password.');
    }
}
