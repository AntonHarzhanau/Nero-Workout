# nero

Application de suivi de musculation en micro-services (Next.js, Symfony, NestJS,
FastAPI, PostgreSQL, Redis).

La documentation du projet (architecture, authentification, données,
Dockerfiles, compose, CI/CD, gestion de projet, rétrospective) est dans
[docs/](docs/README.md).

## Prérequis

- Docker avec une version récente de Docker Compose ; le mode images publiées
  nécessite la prise en charge du tag YAML `!reset`.

Aucun PHP, Node.js ni Python n'est nécessaire sur la machine : tout tourne dans les conteneurs.

## Installation locale

Toutes les commandes se lancent depuis la racine du projet.

### 1. Variables d'environnement

```bash
cp .env.example .env
```

Les valeurs du fichier permettent un démarrage local immédiat, sans modification.
Pour un déploiement serveur, remplacer les mots de passe et `ACCOUNT_APP_SECRET`
par des secrets propres à l'environnement (par exemple avec `openssl rand -hex 32`).

### 2. Démarrage

```bash
docker compose up -d --build --wait
```

Cette commande construit les images, puis :

- `init-secrets` génère au premier lancement la paire de clés RSA des JWT et le
  jeton interne entre services (`X-Internal-Token`), dans des volumes Docker ;
- `account-migration` et `workout-migration` appliquent les migrations ;
- les services démarrent une fois leurs dépendances prêtes.

L'application est disponible sur <http://localhost:3000> (port modifiable avec
`FRONT_PORT`). Les backends, PostgreSQL et Redis ne sont pas exposés.

### 3. Compte admin

Les comptes admin ne peuvent pas être créés via l'API. Au premier démarrage, `account-migration` crée un admin à partir de `ADMIN_NAME`, `ADMIN_USERNAME`, `ADMIN_EMAIL` et `ADMIN_PASSWORD` (`.env`) ; s'il existe déjà un admin, rien n'est fait. Pour en créer un autre à la main (le mot de passe est demandé de façon masquée) :

```bash
docker compose exec account-service php bin/console app:create-admin "Admin" admin admin@nero.local
```

### 4. Vérifications (facultatif)

Connexion à la base avec le rôle dédié du service (attendu : `account_app | nero | accounts`) :

```bash
docker compose exec account-service php bin/console dbal:run-sql "SELECT current_user, current_database(), current_schema()"
```

Configuration JWT (attendu : `The configuration seems correct.`) :

```bash
docker compose exec account-service php bin/console lexik:jwt:check-config
```

## Démarrage avec les images publiées

Pour télécharger les images GHCR au lieu de les construire, ajouter le petit
fichier de surcharge `compose.prod.yaml` au fichier principal (il ne se lance
pas seul) :

```bash
docker compose -f compose.yaml -f compose.prod.yaml up -d --wait
```

`NERO_TAG` sélectionne la version commune des six images (`latest` par défaut,
ou un tag de release / `sha-<SHA complet>` déjà publié). Les migrations réutilisent
les images Account et Workout. À chaque lancement, les images sont téléchargées ;
les sections `build` sont supprimées de la configuration fusionnée. Les sources
ne sont donc pas nécessaires : les deux fichiers Compose et un `.env` suffisent.
Si les images sont privées, s'authentifier d'abord avec `docker login ghcr.io`.
Utiliser une version récente de Docker Compose prenant en charge `!reset`.

Cette surcharge change uniquement l'origine des images : l'application reste
accessible sur le port `FRONT_PORT`. Elle ne configure pas Traefik ni HTTPS.

## Compte et données de démonstration

Après le démarrage des services, charger le jeu de données via leurs API :

```bash
docker compose -f compose.yaml -f compose.demo.yaml run --build --rm demo-fixture
```

Le fichier `compose.demo.yaml` ajoute le service `demo-fixture` à la configuration
principale uniquement pour cette commande.

Connexion : **demo@nero.local** / **NeroDemo2026!** (compte standard `nero_demo`).
Le jeu crée 15 exercices privés, 3 plans et environ 70 séances réparties sur les
24 dernières semaines. Les dates sont calculées en heure de Paris. Il contient
des progressions, des semaines plus légères, des exercices sans historique et
un exercice au poids du corps.

La commande est explicite : le compte de démonstration n'est pas créé au démarrage
normal. Une relance réutilise les ressources marquées `nero-demo-v1` sans supprimer
ni remplacer les données existantes. Pour reproduire une date donnée :

```bash
docker compose -f compose.yaml -f compose.demo.yaml run --rm demo-fixture python /fixtures/seed_demo.py --as-of 2026-10-21
```

Les variables facultatives `DEMO_EMAIL`, `DEMO_USERNAME` et `DEMO_PASSWORD` permettent
de changer l'identité de démonstration. Le mot de passe doit correspondre au compte
si celui-ci existe déjà. Le script ne modifie pas les tables d'un autre service.

Le catalogue des groupes musculaires est chargé automatiquement par Workout à
chaque démarrage. Ses noms sont français ; les codes et les identifiants existants
sont conservés. Les noms du catalogue sont mis à jour, les groupes manquants ajoutés.

Dashboard et Progression utilisent les API authentifiées réelles. Le choix de
l'exercice est conservé sur l'appareil, séparément pour chaque utilisateur.
