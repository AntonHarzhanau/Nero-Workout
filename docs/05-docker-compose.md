# 5. docker-compose

[← Dockerfiles](04-dockerfiles.md) · [Sommaire](README.md) · [Suivant : CI/CD →](06-ci-cd.md)

L'application complète démarre en une commande :

```bash
cp .env.example .env
docker compose up -d --build --wait
```

- `--build` reconstruit les images à partir des sources : chaque service
  déclare `build.context` et `build.target: runtime`.
- `--wait` ne rend la main que lorsque tous les services sont *healthy*.

## Conteneurs

| Service | Type | Image / build | Rôle |
|---|---|---|---|
| `postgres` | permanent | `infra/postgres` | Base de données |
| `redis` | permanent | `redis:8-alpine` | Cache des statistiques |
| `init-secrets` | ponctuel | `infra/secrets` | Génère les clés JWT et le jeton interne |
| `account-migration` | ponctuel | image account-service | Migrations Doctrine |
| `workout-migration` | ponctuel | image workout-service | Migrations TypeORM |
| `account-service` | permanent | `services/account-service` | API comptes |
| `workout-service` | permanent | `services/workout-service` | API entraînements |
| `statistics-service` | permanent | `services/statistics-service` | API statistiques |
| `front` | permanent | `front` | Interface web |

Les conteneurs ponctuels (`restart: "no"`) s'arrêtent une fois leur tâche
terminée. Les autres sont en `restart: unless-stopped`.

## Ordre de démarrage

L'ordre ne repose pas sur un simple ordre de lancement : chaque dépendance
attend que l'autre soit **prête** (`service_healthy`) ou **terminée avec
succès** (`service_completed_successfully`).

```mermaid
flowchart LR
    pg[postgres] -- healthy --> am[account-migration]
    pg -- healthy --> wm[workout-migration]
    sec[init-secrets]
    redis[redis]

    am -- completed --> acc[account-service]
    sec -- completed --> acc
    pg -- healthy --> acc

    wm -- completed --> wo[workout-service]
    sec -- completed --> wo
    pg -- healthy --> wo

    wo -- healthy --> st[statistics-service]
    sec -- completed --> st
    redis -- started --> st

    acc -- healthy --> front[front]
    wo -- healthy --> front
    st -- healthy --> front

    classDef oneshot stroke-dasharray: 5 5
    class sec,am,wm oneshot
```

*(en pointillés : conteneurs ponctuels)*

- Un service ne démarre que si ses **migrations ont réussi** : il ne tourne
  jamais sur un schéma pas à jour.
- Les migrations utilisent **la même image** que leur service, avec une autre
  commande : il n'y a pas d'image à maintenir en plus.
- Si une étape échoue, `docker compose up --wait` échoue lui aussi au lieu de
  démarrer une application à moitié fonctionnelle.

## Réseaux

```mermaid
flowchart TB
    client([Clients]) -- "port FRONT_PORT → 3000" --> front

    subgraph public[public]
        front
    end
    subgraph backend["backend (internal)"]
        account[account-service]
        workout[workout-service]
        stats[statistics-service]
    end
    subgraph database["database (internal)"]
        pg[(postgres)]
        mig[migrations]
    end
    subgraph cache["cache (internal)"]
        redis[(redis)]
    end

    front --- account & workout & stats
    account --- pg
    workout --- pg
    stats --- redis
```

| Réseau | `internal` | Membres |
|---|---|---|
| `public` | non | front |
| `backend` | oui | front, account, workout, statistics |
| `database` | oui | postgres, account, workout, migrations |
| `cache` | oui | statistics, redis |

- **Seul le front publie un port.** Les backends, PostgreSQL et Redis ne sont
  joignables par aucun client.
- Les réseaux `internal: true` n'ont aucun accès vers l'extérieur, ni depuis
  l'extérieur.
- **Moindre privilège réseau** : le front n'est pas sur le réseau `database`,
  le statistics-service non plus, et seul le statistics-service voit Redis. Un
  service compromis ne voit que ce dont il a besoin.

## Secrets

Aucun secret n'est commité ni intégré dans une image.

```mermaid
flowchart LR
    init["init-secrets<br/>network_mode: none"] --> vpriv[(jwt_private)]
    init --> vpub[(jwt_public)]
    init --> vtok[(internal_token)]

    vpriv -- ro --> acc[account-service]
    vpub -- ro --> acc
    vtok -- ro --> acc

    vpub -- ro --> wo[workout-service]
    vtok -- ro --> wo

    vpub -- ro --> st[statistics-service]
    vtok -- ro --> st
```

- **Génération automatique** : au premier lancement, `init-secrets` (sans
  réseau) génère la paire de clés RSA 2048 des JWT et le jeton interne dans des
  volumes nommés.
- **Idempotent** : il ne régénère rien si les secrets existent déjà, et vérifie
  que la clé publique correspond bien à la clé privée. Un redémarrage n'invalide
  donc pas les sessions.
- **Moindre privilège** : seul l'account-service monte la clé privée. Les autres
  ne reçoivent que la clé publique et le jeton interne, toujours en lecture
  seule (`:ro`).
- **Variables obligatoires** : les mots de passe sont déclarés en
  `${VAR:?VAR is required}`. `docker compose` refuse de démarrer si l'une
  d'elles manque, plutôt que de lancer une base sans mot de passe.
- Le fichier `.env` est ignoré par Git ; `.env.example` sert de modèle.

## Factorisation

La configuration de connexion à la base est définie une seule fois avec des
ancres YAML, puis réutilisée par chaque service et sa migration :

```yaml
x-account-db: &account-db
  DB_HOST: postgres
  DB_USER: ${ACCOUNT_DB_USER:?ACCOUNT_DB_USER is required}
  # ...

services:
  account-service:
    environment:
      <<: *account-db
```

## Environnements (TEST / UAT / PROD)

La configuration dépend uniquement du fichier `.env` : le même `compose.yaml`
sert à tous les environnements.

| Variable | Rôle | Exemple TEST / UAT / PROD |
|---|---|---|
| `COMPOSE_PROJECT_NAME` | Isole conteneurs, réseaux et volumes sur un même hôte | `nero-test` / `nero-uat` / `nero-prod` |
| `FRONT_PORT` | Évite les conflits de port | `3000` / `3100` / `80` |
| `AUTH_COOKIE_PREFIX` | Cookies distincts par environnement | `test` / `uat` / `nero` |
| `AUTH_COOKIE_SECURE` | `Secure` obligatoire derrière HTTPS | `false` / `true` / `true` |
| Mots de passe, `ACCOUNT_APP_SECRET`, `REDIS_PASSWORD` | Secrets propres à chaque environnement | — |

```mermaid
flowchart LR
    compose[compose.yaml] --> T[nero-test]
    compose --> U[nero-uat]
    compose --> P[nero-prod]
    et[.env.test] -.-> T
    eu[.env.uat] -.-> U
    ep[.env.prod] -.-> P
```

```bash
docker compose --env-file .env.uat up -d --wait
```

> TODO : ajouter les fichiers d'exemple par environnement et les limites CPU /
> mémoire (`deploy.resources.limits`) si elles sont ajoutées au compose avant le
> rendu.

## Données de démonstration

`compose.demo.yaml` ajoute un service `demo-fixture` qui n'est chargé qu'à la
demande :

```bash
docker compose -f compose.yaml -f compose.demo.yaml run --build --rm demo-fixture
```

Il crée un compte de démonstration et environ 70 séances sur 24 semaines **en
passant par les API** des services, sans écrire directement dans leurs tables.
Le conteneur est en lecture seule (`read_only: true`) et n'est que sur le réseau
`backend`. Il est idempotent : une relance réutilise les ressources existantes.
