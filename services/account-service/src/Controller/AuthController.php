<?php

namespace App\Controller;

use App\Dto\AuthResponse;
use App\Dto\LoginRequest;
use App\Dto\RefreshTokenRequest;
use App\Dto\RegisterRequest;
use App\Dto\UserResponse;
use App\Service\AccountService;
use App\Service\AuthenticationService;
use App\Service\TokenService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/auth', format: 'json')]
final class AuthController extends AbstractController
{
    public function __construct(
        private readonly AccountService $accounts,
        private readonly AuthenticationService $authentication,
        private readonly TokenService $tokens,
    ) {
    }

    #[Route('/register', name: 'auth_register', methods: ['POST'])]
    public function register(#[MapRequestPayload] RegisterRequest $request): JsonResponse
    {
        $user = $this->accounts->register($request);

        return $this->json(UserResponse::fromEntity($user), Response::HTTP_CREATED);
    }

    #[Route('/login', name: 'auth_login', methods: ['POST'])]
    public function login(#[MapRequestPayload] LoginRequest $request): JsonResponse
    {
        $pair = $this->authentication->login($request->email, $request->password);

        return $this->json(AuthResponse::fromTokenPair($pair));
    }

    #[Route('/refresh', name: 'auth_refresh', methods: ['POST'])]
    public function refresh(#[MapRequestPayload] RefreshTokenRequest $request): JsonResponse
    {
        $pair = $this->tokens->refresh($request->refreshToken);

        return $this->json(AuthResponse::fromTokenPair($pair));
    }

    #[Route('/logout', name: 'auth_logout', methods: ['POST'])]
    public function logout(#[MapRequestPayload] RefreshTokenRequest $request): Response
    {
        $this->tokens->revoke($request->refreshToken);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
