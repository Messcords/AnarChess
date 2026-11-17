# AnarChess

A chess game where anarchy rules the game

## Structure du projet

| Dossier | Contenu | Outils |
|---------|---------|--------|
| [endpoints/](endpoints) | Backend : API FastAPI | Python 3.14+, [uv](https://docs.astral.sh/uv/), Make |
| [screens/](screens) | Frontend : application Nuxt | Node.js, [pnpm](https://pnpm.io/), Make |
| [docs/](docs) | Documentation et contrat d'API | |

Chaque partie possède son propre README avec les instructions d'installation et de lancement :

- [Backend](endpoints/README.md)
- [Frontend](screens/README.md)

## Démarrage rapide

Backend (depuis `endpoints`) :

```bash
make install
make serve   # http://127.0.0.1:8000
```

Frontend (depuis `screens`) :

```bash
make install
make serve   # http://localhost:3000
```

Dans les deux dossiers, `make check` lance le lint et les tests, et `make help` liste les commandes.
Côté backend, `make contract` vérifie que l'API respecte le contrat [docs/openapi.yaml](docs/openapi.yaml) avec Schemathesis (voir [endpoints/README.md](endpoints/README.md#tests-de-contrat-schemathesis)).

## Documentation

- User stories : [docs/user-stories.md](docs/user-stories.md)
- Contrat d'API : [docs/openapi.yaml](docs/openapi.yaml)
- Carte des dépendances : [docs/carte-dependances.md](docs/carte-dependances.md)
- Contribuer : [CONTRIBUTING.md](CONTRIBUTING.md)
