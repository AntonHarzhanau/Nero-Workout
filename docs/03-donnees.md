# 3. Données

[← Authentification](02-authentification.md) · [Sommaire](README.md) · [Suivant : Dockerfiles →](04-dockerfiles.md)

## Une base, un schéma et un rôle par service

L'application utilise une seule instance PostgreSQL 17, mais chaque service a
son propre **schéma** et son propre **rôle** :

```mermaid
flowchart LR
    subgraph pg[PostgreSQL · base nero]
        sa[[schéma accounts]]
        sw[[schéma workouts]]
        pub[[schéma public<br/>CREATE révoqué]]
    end
    A[account-service] -- "rôle account_app" --> sa
    W[workout-service] -- "rôle workout_app" --> sw
    A -. "pas d'accès" .-x sw
    W -. "pas d'accès" .-x sa
```

| Service | Rôle PostgreSQL | Schéma | Migrations |
|---|---|---|---|
| account-service | `account_app` | `accounts` | Doctrine Migrations |
| workout-service | `workout_app` | `workouts` | TypeORM migrations |

Le script `infra/postgres/init.sql`, exécuté au premier démarrage du conteneur :

- crée les rôles sans privilège (`NOSUPERUSER NOCREATEDB NOCREATEROLE`), avec
  les mots de passe lus dans les variables d'environnement ;
- rend chaque rôle propriétaire de son schéma et fixe son `search_path` ;
- retire à tout le monde le droit `CREATE` sur le schéma `public`.

Un service compromis ne peut donc lire que ses propres tables. Les données
partagées passent toujours par une API.

**Pourquoi une seule instance ?** Une instance par service serait plus isolée,
mais consommerait plus de mémoire pour un projet de cette taille. Avec un schéma
et un rôle par service, l'isolation logique est la même. Passer à une instance
par service ne demanderait que de changer `DB_HOST`.

## Modèle de données

### Schéma `accounts`

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : "possède"
    USERS {
        uuid id PK
        string name
        string username
        string email
        string password "hash"
        enum role "standard | admin"
        timestamp created_at
        timestamp updated_at
    }
    SESSIONS {
        uuid id PK
        uuid user_id FK
        string refresh_token_hash
        timestamp expires_at
        timestamp revoked_at "null si active"
        timestamp created_at
    }
```

### Schéma `workouts`

```mermaid
erDiagram
    EXERCISES }o--o{ MUSCLE_GROUPS : "exercise_muscle_groups"
    PLANS ||--o{ PLAN_EXERCISES : contient
    PLAN_EXERCISES }o--|| EXERCISES : référence
    PLAN_EXERCISES ||--o{ PLAN_SETS : "séries prévues"
    WORKOUTS ||--o{ WORKOUT_EXERCISES : contient
    WORKOUT_EXERCISES }o--|| EXERCISES : référence
    WORKOUT_EXERCISES ||--o{ WORKOUT_SETS : "séries réalisées"

    EXERCISES {
        uuid id PK
        uuid owner_id "id utilisateur (JWT)"
        string title
        string description
        enum visibility
        string equipment
    }
    MUSCLE_GROUPS {
        uuid id PK
        string code UK
        string name
    }
    PLANS {
        uuid id PK
        uuid owner_id
        string title
        string description
    }
    PLAN_EXERCISES {
        uuid id PK
        uuid plan_id FK
        uuid exercise_id FK
        int position
    }
    PLAN_SETS {
        uuid id PK
        uuid plan_exercise_id FK
        smallint position
        decimal weight_kg
        smallint reps
    }
    WORKOUTS {
        uuid id PK
        uuid owner_id
        string title
        date workout_date
        smallint duration_minutes
        string description
    }
    WORKOUT_EXERCISES {
        uuid id PK
        uuid workout_id FK
        uuid exercise_id FK
        string exercise_name_snapshot
        text_array muscle_groups_snapshot
        int position
    }
    WORKOUT_SETS {
        uuid id PK
        uuid workout_exercise_id FK
        smallint position
        decimal weight_kg
        smallint reps
    }
```

Choix notables :

- **`owner_id` sans clé étrangère vers `accounts.users`.** Une contrainte entre
  schémas couplerait les deux services au niveau SQL. L'identifiant vient du JWT,
  et la cohérence lors d'une suppression de compte est assurée par l'API interne
  ([voir la suppression de compte](02-authentification.md#rôles-et-suppression-de-comptes)).
- **Snapshots dans les séances.** `workout_exercises` conserve le nom de
  l'exercice et ses groupes musculaires au moment de la séance : l'historique et
  les statistiques restent justes même si l'exercice est renommé par la suite.
- **Suppressions en cascade** (`ON DELETE CASCADE`) des plans et séances vers
  leurs exercices et séries.
- Le catalogue des groupes musculaires est (re)chargé par le workout-service à
  chaque démarrage, sans modifier les identifiants existants.

## Cache Redis du statistics-service

Le statistics-service ne stocke aucune donnée durable. Redis ne sert que de
cache pour les calculs :

```mermaid
flowchart TD
    req[Requête /stats/...] --> fetch[Lecture des séances<br/>via workout-service]
    fetch --> hash[Calcul de l'empreinte<br/>des séances]
    hash --> lookup{Entrée en cache avec<br/>la même empreinte ?}
    lookup -- oui --> hit[Résultat en cache]
    lookup -- non --> compute[Calcul des statistiques]
    compute --> store[Écriture dans Redis<br/>TTL 24 h]
    store --> res[Réponse]
    hit --> res
```

Les séances sont relues à chaque requête et le cache n'est réutilisé que si leur
empreinte n'a pas changé : un résultat périmé ne peut pas être servi, et aucune
invalidation explicite n'est nécessaire. Le cache évite de refaire des calculs
coûteux, pas des lectures.

Configuration Redis : mot de passe obligatoire, `maxmemory 64mb` avec éviction
LRU, persistance désactivée (`--save ""`, `--appendonly no`). Perdre le cache
ne fait perdre aucune donnée.
