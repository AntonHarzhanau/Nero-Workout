# nero

## Prérequis

- Docker Desktop (Docker Compose v2)
- OpenSSL (fourni avec Git Bash sous Windows)

Aucun PHP ni Composer n'est nécessaire sur la machine : tout tourne dans les conteneurs.

## Installation locale

Toutes les commandes se lancent depuis la racine du projet.

### 1. Variables d'environnement

```bash
cp .env.example .env
cp services/account-service/.env.example services/account-service/.env
```

Si le port 5432 est déjà pris sur ta machine (Postgres local, plage réservée par Windows), change `POSTGRES_PORT` dans `.env` (par exemple `5433`).

### 2. Clés JWT

L'account-service signe les JWT avec une clé privée RSA ; les autres services les vérifient avec la clé publique. Les clés sont montées dans les conteneurs comme secrets Docker et ne sont jamais commitées (`secrets/` est ignoré par Git).

```bash
mkdir -p secrets
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out secrets/jwt_private.pem
openssl pkey -in secrets/jwt_private.pem -pubout -out secrets/jwt_public.pem
```

### 3. Démarrage

```bash
docker compose up -d --build --wait
docker compose exec account-service composer install
docker compose exec account-service php bin/console doctrine:migrations:migrate --no-interaction
```

### 4. Vérifications

Connexion à la base avec le rôle dédié du service (attendu : `account_app | nero | accounts`) :

```bash
docker compose exec account-service php bin/console dbal:run-sql "SELECT current_user, current_database(), current_schema()"
```

Configuration JWT (attendu : `The configuration seems correct.`) :

```bash
docker compose exec account-service php bin/console lexik:jwt:check-config
```
