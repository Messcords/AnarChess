# Objectifs

## Hier (16/11/2026)

Vérifié d'après l'historique git (commits du 16/11) et le code.

### Back

- [x] Création de partie et génération du plateau
  - `POST /boards` crée une partie et renvoie le plateau initial (`initial_board()` dans `endpoints/src/services/boards.py`).
- [x] Routes du back
  - `POST /boards`, `POST /boards/{id}/join`, `GET /boards/{id}`, `PATCH /boards/{id}`, `POST /boards/{id}/reset` (`endpoints/src/api/boards.py`), conformes au contrat `docs/openapi.yaml`.
  - Tests associés : `endpoints/test/`.
  - Limite : les parties sont stockées en mémoire (pas encore en base).

### Front

- [x] Afficher le plateau et les pions
  - Plateau 8x8 (`Board.vue`), pièces, sélection en deux clics, déplacements libres, branchement sur l'état de la partie (`index.vue`, `chess.ts`, `pieces.ts`).
  - Tests : `Board.spec.ts`, `index.spec.ts`, `chess.spec.ts`, `pieces.spec.ts`, `apiError.spec.ts`.

## Aujourd'hui (17/11/2026)

### Front

- [ ] Implémentation des règles de déplacement des pièces
- [ ] Système de tour par tour

### Back

- [ ] Persistance de la partie en base de données (MongoDB)
  - Aujourd'hui `BoardService` garde les parties dans un dictionnaire en mémoire ; `mongodb.py` ne fait que la connexion.

### Tâche supplémentaire

- [ ] Réalisation des tests de chargement (load tests)

### Tâche avenir

- [ ] Finaliser le README.md et faire en sorte que le projet se lance avec une seule commande