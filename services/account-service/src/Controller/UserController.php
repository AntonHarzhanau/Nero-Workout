<?php

namespace App\Controller;

use App\Dto\UserResponse;
use App\Entity\User;
use App\Security\Voter\UserVoter;
use App\Service\AccountService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/users', format: 'json')]
final class UserController extends AbstractController
{
    public function __construct(
        private readonly AccountService $accounts,
    ) {
    }

    #[Route('/me', name: 'users_me', methods: ['GET'])]
    public function me(#[CurrentUser] User $user): JsonResponse
    {
        return $this->json(UserResponse::fromEntity($user));
    }

    #[Route('/me', name: 'users_me_delete', methods: ['DELETE'])]
    public function deleteMe(#[CurrentUser] User $user): Response
    {
        $this->denyAccessUnlessGranted(UserVoter::DELETE, $user);

        $this->accounts->delete($user);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
