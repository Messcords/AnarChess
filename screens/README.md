# Frontend

Application Nuxt d'AnarChess.

## Prérequis

- Node.js
- [pnpm](https://pnpm.io/)
- GNU Make

## Installation

Depuis le dossier `screens` :

```bash
make install
```

## Lancement

```bash
make serve
```

Le serveur de développement est disponible sur <http://localhost:3000>.

Le frontend appelle l'API sur <http://127.0.0.1:8000> par défaut. Pour changer
cette adresse, définissez `NUXT_PUBLIC_API_BASE`. En développement, le backend
autorise les origines locales `localhost:3000` et `127.0.0.1:3000`; pour un
autre hôte frontend, configurez `CORS_ORIGINS` côté backend.

## Qualité

```bash
make check   # lint + tests
make lint    # ESLint
make fix     # corrections automatiques ESLint
```

## Production

```bash
make build     # build de production
make preview   # prévisualisation du build
```

Pour afficher les autres commandes disponibles :

```bash
make help
```

Voir la [documentation Nuxt](https://nuxt.com/docs/getting-started/introduction) pour plus d'informations.
