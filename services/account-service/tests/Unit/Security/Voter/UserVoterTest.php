<?php

namespace App\Tests\Unit\Security\Voter;

use App\Entity\User;
use App\Entity\UserRole;
use App\Security\Voter\UserVoter;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Authentication\Token\NullToken;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Security\Core\Authorization\Voter\VoterInterface;

final class UserVoterTest extends TestCase
{
    /**
     * @return iterable<string, array{UserRole, UserRole, bool, int}>
     */
    public static function deletionCases(): iterable
    {
        yield 'standard deletes own account' => [UserRole::Standard, UserRole::Standard, true, VoterInterface::ACCESS_GRANTED];
        yield 'admin deletes own account' => [UserRole::Admin, UserRole::Admin, true, VoterInterface::ACCESS_GRANTED];
        yield 'admin deletes a standard account' => [UserRole::Admin, UserRole::Standard, false, VoterInterface::ACCESS_GRANTED];
        yield 'admin deletes another admin' => [UserRole::Admin, UserRole::Admin, false, VoterInterface::ACCESS_DENIED];
        yield 'standard deletes another standard' => [UserRole::Standard, UserRole::Standard, false, VoterInterface::ACCESS_DENIED];
        yield 'standard deletes an admin' => [UserRole::Standard, UserRole::Admin, false, VoterInterface::ACCESS_DENIED];
    }

    #[DataProvider('deletionCases')]
    public function testDeletionRules(UserRole $currentRole, UserRole $targetRole, bool $self, int $expected): void
    {
        $current = $this->user('current', $currentRole);
        $target = $self ? $current : $this->user('target', $targetRole);

        self::assertSame($expected, (new UserVoter())->vote($this->tokenFor($current), $target, [UserVoter::DELETE]));
    }

    public function testAnonymousUserCannotDeleteAnyAccount(): void
    {
        $vote = (new UserVoter())->vote(new NullToken(), $this->user('target', UserRole::Standard), [UserVoter::DELETE]);

        self::assertSame(VoterInterface::ACCESS_DENIED, $vote);
    }

    public function testAbstainsOnOtherAttributes(): void
    {
        $user = $this->user('current', UserRole::Admin);

        self::assertSame(VoterInterface::ACCESS_ABSTAIN, (new UserVoter())->vote($this->tokenFor($user), $user, ['USER_EDIT']));
    }

    public function testAbstainsOnOtherSubjects(): void
    {
        $user = $this->user('current', UserRole::Admin);

        self::assertSame(VoterInterface::ACCESS_ABSTAIN, (new UserVoter())->vote($this->tokenFor($user), new \stdClass(), [UserVoter::DELETE]));
    }

    private function user(string $username, UserRole $role): User
    {
        return (new User(ucfirst($username), $username, $username.'@example.com'))->setRole($role);
    }

    private function tokenFor(User $user): TokenInterface
    {
        return new UsernamePasswordToken($user, 'main', $user->getRoles());
    }
}
