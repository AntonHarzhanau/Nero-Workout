<?php

namespace App\Security\Voter;

use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Account deletion rules:
 *  - any user can delete their own account;
 *  - an admin can delete standard accounts, but not other admins.
 *
 * @extends Voter<string, User>
 */
final class UserVoter extends Voter
{
    public const DELETE = 'USER_DELETE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return self::DELETE === $attribute && $subject instanceof User;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $currentUser = $token->getUser();
        if (!$currentUser instanceof User) {
            return false;
        }

        if ($currentUser->getId()->equals($subject->getId())) {
            return true;
        }

        if ($currentUser->isAdmin() && !$subject->isAdmin()) {
            return true;
        }

        $vote?->addReason('Admin accounts can only be deleted by their owner.');

        return false;
    }
}
