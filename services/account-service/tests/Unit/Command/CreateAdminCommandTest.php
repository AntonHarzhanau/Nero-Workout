<?php

namespace App\Tests\Unit\Command;

use App\Command\CreateAdminCommand;
use App\Dto\RegisterRequest;
use App\Entity\User;
use App\Entity\UserRole;
use App\Service\AccountService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Validator\Validation;

final class CreateAdminCommandTest extends TestCase
{
    public function testSkipsWhenAnAdminAlreadyExists(): void
    {
        $accounts = $this->createMock(AccountService::class);
        $accounts->method('hasAdmin')->willReturn(true);
        $accounts->expects($this->never())->method('register');

        self::assertSame(Command::SUCCESS, $this->runCommand($accounts, 'env-secret-123', skipIfExists: true));
    }

    public function testCreatesTheAdminWithThePasswordFromTheEnvironment(): void
    {
        $accounts = $this->createMock(AccountService::class);
        $accounts->method('hasAdmin')->willReturn(false);
        $accounts->expects($this->once())->method('register')
            ->with(
                $this->callback(fn (RegisterRequest $r): bool => 'env-secret-123' === $r->password),
                UserRole::Admin,
            )
            ->willReturn(new User('Admin', 'admin', 'admin@nero.local'));

        self::assertSame(Command::SUCCESS, $this->runCommand($accounts, 'env-secret-123', skipIfExists: true));
    }

    public function testCreatesAnotherAdminWhenNotAskedToSkip(): void
    {
        $accounts = $this->createMock(AccountService::class);
        $accounts->expects($this->never())->method('hasAdmin');
        $accounts->expects($this->once())->method('register')->willReturn(new User('Admin', 'admin', 'admin@nero.local'));

        self::assertSame(Command::SUCCESS, $this->runCommand($accounts, 'env-secret-123'));
    }

    public function testFailsWithoutAPasswordInNonInteractiveMode(): void
    {
        $accounts = $this->createMock(AccountService::class);
        $accounts->method('hasAdmin')->willReturn(false);
        $accounts->expects($this->never())->method('register');

        self::assertSame(Command::FAILURE, $this->runCommand($accounts, null, skipIfExists: true));
    }

    private function runCommand(AccountService $accounts, ?string $envPassword, bool $skipIfExists = false): int
    {
        $validator = Validation::createValidatorBuilder()->enableAttributeMapping()->getValidator();
        $input = new ArrayInput([]);
        $input->setInteractive(false);
        $io = new SymfonyStyle($input, new BufferedOutput());

        return (new CreateAdminCommand($accounts, $validator, $envPassword))(
            $io, 'Admin', 'admin', 'admin@nero.local', skipIfExists: $skipIfExists,
        );
    }
}
