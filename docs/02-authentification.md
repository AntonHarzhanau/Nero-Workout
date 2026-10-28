# 2. Authentification et sessions

[← Architecture](01-architecture.md) · [Sommaire](README.md) · [Suivant : Données →](03-donnees.md)

## Principe

- L'**account-service** est le seul service à connaître les mots de passe et le
  seul à signer des jetons. Il signe des **JWT RS256** avec une clé privée qu'il
  est le seul à monter.
- Le **workout-service** et le **statistics-service** vérifient la signature
  avec la **clé publique**. Pour authentifier une requête, ils n'ont pas besoin
  d'appeler l'account-service.
- Le **front** ne stocke rien côté serveur : les jetons sont dans des cookies du
  navigateur.

| Jeton | Durée de vie | Stockage côté client | Stockage côté serveur |
|---|---|---|---|
| Access token (JWT RS256) | 15 min | Cookie `<prefixe>_access_token` | Aucun (vérifié par signature) |
| Refresh token | 7 jours | Cookie `<prefixe>_refresh_token` | **Haché** dans `accounts.sessions` |

Les cookies sont `HttpOnly` (invisibles pour le JavaScript de la page),
`SameSite=Lax`, et `Secure` quand l'application est servie en HTTPS
(`AUTH_COOKIE_SECURE`).

## Connexion

```mermaid
sequenceDiagram
    autonumber
    actor U as Navigateur
    participant F as front (Server Action)
    participant A as account-service
    participant DB as PostgreSQL (accounts)

    U->>F: POST formulaire de connexion
    F->>A: POST /auth/login {email, password}
    A->>DB: recherche de l'utilisateur
    A->>A: vérification du mot de passe (hash)
    A->>A: signature du JWT (clé privée RS256)
    A->>DB: INSERT session (hash du refresh token, expiration)
    A-->>F: {accessToken, refreshToken, expiresIn}
    F-->>U: Set-Cookie HttpOnly ×2 + redirection vers returnTo
```

## Rafraîchissement et déconnexion

```mermaid
sequenceDiagram
    autonumber
    participant F as front
    participant A as account-service
    participant DB as PostgreSQL (accounts)

    Note over F,A: Rafraîchissement
    F->>A: POST /auth/refresh {refreshToken}
    A->>DB: session correspondant au hash SHA-256 ?
    alt session déjà révoquée (jeton rejoué)
        A->>DB: révocation de TOUTES les sessions de l'utilisateur
        A-->>F: 401
    else session active
        A->>DB: révocation de l'ancienne session
        A->>DB: nouvelle session (nouveau refresh token)
        A-->>F: nouveau couple de jetons
    end

    Note over F,A: Déconnexion
    F->>A: POST /auth/logout {refreshToken}
    A->>DB: revoked_at = now()
    F->>F: suppression des cookies
```

Chaque refresh token ne sert qu'une fois (rotation). Si un jeton déjà utilisé
est présenté à nouveau, c'est le signe qu'il a été volé : l'account-service
révoque alors toutes les sessions de l'utilisateur, ce qui déconnecte aussi le
voleur.

## Pourquoi le front est sans état

```mermaid
flowchart LR
    U([Navigateur<br/>cookies]) --> LB{{n'importe quelle<br/>instance front}}
    LB --> F1[front #1]
    LB --> F2[front #2]
    F1 & F2 -- "JWT" --> A[account-service]
    A --> DB[(sessions)]
```

À chaque rendu d'une page privée, le front relit le cookie et appelle
`GET /users/me`. Il n'a ni mémoire de session ni stockage local : n'importe
quelle instance du conteneur `front` peut servir n'importe quelle requête, et un
redémarrage du front ne déconnecte personne. L'état de session est externalisé
dans l'account-service et sa base.

## Contrôle d'accès côté front

```mermaid
flowchart TD
    req[Requête sur une page] --> group{Groupe de routes}
    group -- "/ , /login, /register" --> ok[Page affichée]
    group -- "(private)" --> cookie{Cookie access token ?}
    cookie -- non --> redirect["Redirection /login?returnTo=…"]
    cookie -- oui --> me{"GET /users/me"}
    me -- 401 --> redirect
    me -- 200 --> admin{"Page /users ?"}
    admin -- non --> ok2[Page affichée]
    admin -- oui --> role{rôle admin ?}
    role -- oui --> ok2
    role -- non --> nf[404]
```

- Toutes les pages privées sont sous le layout `(private)`, qui appelle
  `requireCurrentUser()` : un visiteur non connecté est redirigé vers la page de
  connexion, puis renvoyé à la page demandée (`returnTo`) une fois connecté.
- Avant connexion, seules la page d'accueil, `/login` et `/register` sont
  accessibles.
- Le front ne fait que **masquer** ce qui n'est pas autorisé. La vraie
  vérification se fait dans les backends, qui valident le JWT et le rôle à
  chaque requête.

## Rôles et suppression de comptes

| Action | standard | admin |
|---|---|---|
| Créer un compte via le site | Oui (rôle `standard`) | Non (commande console uniquement) |
| Supprimer son propre compte | Oui | Oui |
| Lister les comptes | Non | Oui |
| Supprimer un compte standard | Non | Oui |
| Supprimer un autre admin | Non | Non |

Ces règles sont centralisées dans un *voter* Symfony (`UserVoter`). Un admin se
crée avec :

```bash
docker compose exec account-service php bin/console app:create-admin "Admin" admin admin@nero.local
```

La suppression d'un compte supprime aussi ses données d'entraînement, qui se
trouvent dans un autre service :

```mermaid
sequenceDiagram
    autonumber
    participant F as front
    participant A as account-service
    participant W as workout-service
    participant DBA as schéma accounts
    participant DBW as schéma workouts

    F->>A: DELETE /users/me ou /admin/users/{id}
    A->>A: UserVoter : suppression autorisée ?
    A->>W: DELETE /internal/users/{id} (X-Internal-Token)
    W->>DBW: suppression séances, plans, exercices
    W-->>A: 204
    A->>DBA: suppression utilisateur et sessions
    A-->>F: 204
```

Les données d'entraînement sont purgées **avant** le compte : en cas d'échec du
workout-service, le compte est conservé et la suppression peut être relancée.
Aucune donnée ne reste sans propriétaire.
