# 7. Gestion de projet

[← CI/CD](06-ci-cd.md) · [Sommaire](README.md) · [Suivant : Rétrospective →](08-retrospective.md)

## Outils

Le suivi des tâches a été fait avec **GitHub Projects** : chaque fonctionnalité
ou tâche technique y était une carte. Chaque carte était réalisée dans une
branche dédiée, puis fusionnée dans `main` par pull request
([voir le workflow Git](06-ci-cd.md#branches-et-pull-requests)).

```mermaid
flowchart LR
    card[Carte GitHub Projects] --> branch[Branche feat/… ci/…]
    branch --> pr[Pull request]
    pr --> ci{CI verte ?}
    ci -- non --> branch
    ci -- oui --> merge[Fusion dans main]
    merge --> done[Carte terminée]
```

## Répartition

Répartition principale, telle qu'elle apparaît dans l'historique Git :

| Anton Harzhanau | Dzidoula Godwin KPOGLO |
|---|---|
| Initialisation du dépôt, PostgreSQL (rôles et schémas) | account-service : comptes, JWT RS256, refresh tokens, admin |
| workout-service (exercices, plans, séances, API interne) | Tests unitaires de l'account-service |
| Frontend Next.js | statistics-service (FastAPI, cache Redis, tests) |
| Mise en place Docker et CI, publication des images | Conteneurisation de l'account-service et du statistics-service, CI du statistics-service |

## Chronologie

```mermaid
gantt
    title Déroulement du projet (octobre 2026)
    dateFormat YYYY-MM-DD
    axisFormat %d/%m

    section Socle
    Initialisation, PostgreSQL           :2026-10-15, 2d
    section account-service
    Comptes, JWT, admin, tests           :2026-10-16, 3d
    section workout-service
    Exercices, plans, séances            :2026-10-15, 3d
    Auth et purge des données            :2026-10-18, 1d
    API statistiques interne             :2026-10-19, 1d
    section front
    Auth et routes protégées             :2026-10-19, 1d
    Pages métier                         :2026-10-19, 1d
    Tableau de bord                      :2026-10-21, 1d
    section statistics-service
    FastAPI, Redis, tests                :2026-10-20, 2d
    section Docker et CI
    CI workout                           :2026-10-17, 1d
    Docker et CI                         :2026-10-20, 1d
    CI unifiée, images versionnées       :2026-10-21, 2d
    section Livrables
    Documentation                        :2026-10-27, 3d
    Démo live                            :milestone, 2026-10-30, 0d
```
