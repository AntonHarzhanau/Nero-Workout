<?php

namespace App\Controller;

use App\Dto\UserResponse;
use App\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/users', format: 'json')]
final class UserController extends AbstractController
{
    #[Route('/me', name: 'users_me', methods: ['GET'])]
    public function me(#[CurrentUser] User $user): JsonResponse
    {
        return $this->json(UserResponse::fromEntity($user));
    }
}
