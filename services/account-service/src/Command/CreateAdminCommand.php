<?php

namespace App\Command;

use App\Dto\RegisterRequest;
use App\Entity\UserRole;
use App\Exception\AccountAlreadyExistsException;
use App\Service\AccountService;
use Symfony\Component\Console\Attribute\Argument;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Attribute\Option;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Validator\Validator\ValidatorInterface;


#[AsCommand(name: 'app:create-admin', description: 'Creates an admin account')]
final class CreateAdminCommand
{
    public function __construct(
        private readonly AccountService $accounts,
        private readonly ValidatorInterface $validator,
    ) {
    }

    public function __invoke(
        SymfonyStyle $io,
        #[Argument(description: 'Display name')] string $name,
        #[Argument(description: 'Unique username')] string $username,
        #[Argument(description: 'Email used to log in')] string $email,
        #[Option(description: 'Password (prompted, hidden, when omitted)')] ?string $password = null,
    ): int {
        $password ??= (string) $io->askHidden('Password');

        $request = new RegisterRequest($name, $username, $email, $password);
        $violations = $this->validator->validate($request);
        if (\count($violations) > 0) {
            foreach ($violations as $violation) {
                $io->error(sprintf('%s: %s', $violation->getPropertyPath(), $violation->getMessage()));
            }

            return Command::FAILURE;
        }

        try {
            $user = $this->accounts->register($request, UserRole::Admin);
        } catch (AccountAlreadyExistsException $e) {
            $io->error($e->getMessage());

            return Command::FAILURE;
        }

        $io->success(sprintf('Admin "%s" created (id %s).', $user->getEmail(), $user->getId()->toRfc4122()));

        return Command::SUCCESS;
    }
}
