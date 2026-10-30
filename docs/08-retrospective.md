# 8. Rétrospective

[← Gestion de projet](07-gestion-projet.md) · [Sommaire](README.md)

## Difficultés rencontrées et solutions

| Difficulté | Solution |
|---|---|
| **Génération manuelle des secrets** : au départ, chaque développeur devait créer les clés JWT et le jeton interne avec `openssl` avant le premier lancement, d'où des oublis et des erreurs. | Conteneur `init-secrets` idempotent lancé par le compose, qui écrit dans des volumes montés en lecture seule ([voir Secrets](05-docker-compose.md#secrets)). |
| **Migrations lancées à la main** après le démarrage (`docker compose exec … migrate`). | Conteneurs de migration ponctuels et `depends_on: service_completed_successfully`. |
| **Fins de ligne CRLF** sous Windows : les scripts shell copiés dans les images échouaient sous Linux. | `.gitattributes` imposant LF sur les `*.sh`. |
| **Cache Symfony au build** : `cache:warmup` exige des variables de connexion à la base qui n'existent pas au moment du build. | Valeurs factices passées uniquement à la commande de warmup ; les vraies valeurs sont injectées à l'exécution. |
| **FrankenPHP en non root** : le binaire porte une capability réseau qui pose problème sous un utilisateur sans privilège. | `setcap -r` sur le binaire et écoute sur le port 8080. |
| **Partage de données entre services** sans base commune (suppression de compte, statistiques). | Routes `/internal` authentifiées par un jeton partagé ; snapshots des exercices dans les séances ([voir Données](03-donnees.md)). |
| **Configuration Compose partagée** : variables modifiées en parallèle dans plusieurs branches et besoin de distinguer le build local des images publiées. | Ancres YAML, valeurs locales prêtes à l'emploi dans `.env.example` et surcharge `compose.prod.yaml` qui remplace les builds par les images GHCR, sans recopier les réseaux, volumes ni dépendances ([voir Compose](05-docker-compose.md#démarrage-local-et-images-publiées)). |
| **Images de release** reconstruites à partir du tag, donc potentiellement différentes de celles testées. | Re-étiquetage de l'image `sha-<commit>` existante au lieu d'un nouveau build ([voir CI/CD](06-ci-cd.md#une-release-ne-reconstruit-pas-limage)). |

Toutes ces difficultés vont dans le même sens : chaque étape manuelle a fini
par être automatisée dans le compose ou la CI.

```mermaid
flowchart LR
    m1[openssl à la main] --> a1[init-secrets]
    m2[migrate à la main] --> a2[conteneurs de migration]
    m3[rebuild au tag] --> a3[re-tag de l'image testée]
    a1 & a2 --> up["docker compose up --wait"]
    a3 --> ci[CI reproductible]
```

## Si c'était à refaire

- **Poser le socle Docker dès le premier jour** (compose, secrets, migrations,
  CI) avant d'écrire le code métier : plusieurs étapes manuelles ont dû être
  automatisées après coup.
- **Écrire les contrats d'API entre services** (OpenAPI) avant de les
  implémenter, pour développer le front et les backends en parallèle avec moins
  d'allers-retours.
- **Enrichir la pipeline** : analyse de vulnérabilités des images (Trivy,
  Docker Scout), lint systématique, test de démarrage du compose complet.
- **Prévoir dès le départ les deux modes de lancement** : build local avec
  des valeurs de développement, images publiées avec des secrets propres au
  serveur. Les limites CPU et mémoire restent à définir dans les fichiers
  Compose partagés.
