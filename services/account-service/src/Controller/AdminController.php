<?php

namespace App\Controller;

use App\Dto\UserResponse;
use App\Entity\User;
use App\Security\Voter\UserVoter;
use App\Service\AccountService;
use Symfony\Bridge\Doctrine\Attribute\MapEntity;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Requirement\Requirement;
use Symfony\Component\Security\Http\Attribute\IsGranted;

// Also enforced by access_control on ^/admin: kept here so the rule travels with the code
#[Route('/admin/users', format: 'json')]
#[IsGranted('ROLE_ADMIN')]
final class AdminController extends AbstractController
{
    public function __construct(
        private readonly AccountService $accounts,
    ) {
    }

    #[Route('', name: 'admin_users_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        return $this->json([
            'items' => array_map(UserResponse::fromEntity(...), $this->accounts->listAll()),
        ]);
    }

    #[Route('/{id}', name: 'admin_users_delete', requirements: ['id' => Requirement::UUID], methods: ['DELETE'])]
    public function delete(#[MapEntity(id: 'id')] User $user): Response
    {
        $this->denyAccessUnlessGranted(UserVoter::DELETE, $user);

        $this->accounts->delete($user);

        return new Response(status: Response::HTTP_NO_CONTENT);
    }
}
