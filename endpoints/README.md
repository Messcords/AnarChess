# Backend

## Prérequis

- Python 3.14 ou supérieur
- [uv](https://docs.astral.sh/uv/)
- GNU Make

## Installation

Depuis le dossier `endpoints` :

```bash
make install
```

Cette commande installe les dépendances du backend et les outils de développement.

## Lancement

Toujours depuis `endpoints` :

```bash
make serve
```

L'API est disponible sur <http://127.0.0.1:8000>.
La documentation interactive se trouve sur <http://127.0.0.1:8000/docs>.

## Vérifications

Toujours depuis `endpoints` :

| Commande | Rôle |
|----------|------|
| `make lint` | Vérifie le code avec Ruff |
| `make check` | Lance les tests (pytest) |
| `make contract` | Lance les tests de contrat Schemathesis |
| `make audit` | Cherche les failles connues dans les dépendances (pip-audit) |

### Tests de contrat (Schemathesis)

`make contract` lit le contrat [docs/openapi.yaml](../docs/openapi.yaml) et
génère automatiquement des requêtes pour chaque opération (`createBoard`,
`joinBoard`, `getBoardState`, `updateBoardState`, `resetBoard`). Il vérifie
que l'API répond comme le contrat le décrit : codes HTTP documentés, schémas
des réponses, absence d'erreur serveur.

- Les tests appellent directement l'application FastAPI : pas besoin de lancer
  `make serve` ni MongoDB.
- Ils sont exclus de `make check` (marqueur pytest `fuzz`) et tournent dans un
  job séparé de la CI, `API contract (Schemathesis)`. Ce job est **non
  bloquant** tant que les écarts connus entre le contrat et l'API ne sont pas
  corrigés : supprimer `continue-on-error: true` dans
  `.github/workflows/ci.yml` pour le rendre obligatoire.
- En cas d'échec, Schemathesis affiche une commande `curl` pour reproduire la
  requête fautive.
- Le code des tests est dans `test/test_schemathesis.py`.

Pour afficher les autres commandes disponibles :

```bash
make help
```
