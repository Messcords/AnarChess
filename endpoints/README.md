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

Pour afficher les autres commandes disponibles :

```bash
make help
```
