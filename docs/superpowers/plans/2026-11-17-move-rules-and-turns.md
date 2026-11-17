# Règles de déplacement et tour par tour — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sur le plateau du front, chaque pièce ne peut aller que sur ses
cases autorisées (mises en évidence), puis les blancs et les noirs jouent
chacun leur tour avec un indicateur « Au tour des … ».

**Architecture:** Une nouvelle logique pure `app/utils/rules.ts`
(`legalMoves`) s'appuie sur le plateau en matrice déjà en place
(`pieces.ts`) et sur deux petites fonctions de géométrie ajoutées à
`chess.ts`. `Board.vue` s'en sert pour mettre en évidence les cases et
n'émettre que des coups autorisés ; la page garde le tour (`'white' |
'black'`, mêmes valeurs que `gameState.turn` du contrat).

**Tech Stack:** Nuxt 4, Vue 3 (`<script setup lang="ts">`), Vitest 5 +
`@nuxt/test-utils`, ESLint (`@nuxt/eslint`), pnpm, Make.

**Spec:** issue GitHub #16 « Règles de déplacement des pièces et tour par
tour blancs/noirs » — https://github.com/Messcords/AnarChess/issues/16

## Global Constraints

- Tout se passe dans le front (`screens/`), aucun appel API.
- Hors périmètre (issue #16) : échec / mat / pat, prise en passant, fin de
  partie, envoi au back, glisser-déposer, animations. **Ajout demandé par
  l'utilisateur après la tâche 2** : roque et promotion automatique en dame
  (tâche 2b).
- Deux sous-objectifs, **une branche chacun**, partant de `dev` (la branche
  d'équipe de `CONTRIBUTING.md` ; une branche `develop` avait d'abord été
  créée par erreur, la branche 1 a été rebasée sur `origin/dev`) :
  1. `feat/16-piece-move-rules` — tâches 1, 2 et 2b (règles de déplacement) ;
  2. `feat/16-turn-order` — tâches 3 à 4 (tour par tour). Prévue depuis
     `dev` après le merge de la branche 1 ; **finalement empilée sur la
     branche 1** (l'utilisateur a demandé de continuer avant le merge) : à
     fusionner après elle.
- Fin de branche : l'utilisateur ouvre la PR vers `dev` et la fusionne.
- Commits : d'abord faits par l'utilisateur ; **depuis l'ajout de
  `AGENT.md`, l'agent commite lui-même**, sans jamais s'ajouter comme
  contributeur, et en regroupant comme l'utilisateur le demande.
- Avant chaque commit, depuis `screens/` : `make lint` puis `make check`,
  sans erreur **ni warning** ; corriger avant de proposer le commit.
- TDD : le test d'abord, le voir échouer, puis le code minimal.
- Code **très simple à lire** : boucles et `if` explicites, noms clairs,
  directions en objets `{ row, col }`, pas d'astuces de typage ni de
  conditions de boucle « malines ». Commenter seulement les fonctions
  difficiles (`slidingMoves`, `pawnMoves`, `onSquareClick`) ; fonctions
  ≤ 60 lignes.
- Ne pas réécrire l'existant : seules modifications d'existant prévues =
  remplacer `toIndex` privé de `pieces.ts` par la fonction partagée de
  `chess.ts` (tâche 1), la logique de clic de `Board.vue` (tâches 2 et 3),
  la page (tâche 4) et deux tests de page devenus faux avec les règles.
- **Ne jamais toucher aux README.** La doc, c'est ce plan : cocher les
  étapes faites à chaque point de commit (et le joindre au commit).
- Commits en anglais, titre ≤ 50 caractères, corps avec `Refs #16`,
  **sans** ligne `Co-Authored-By` (voir `AGENT.md` à la racine).
- Pas de type-check dans le projet (`vue-tsc` absent) : on ne l'ajoute pas ici.

## Review Focus

- Pion arrivé sur la dernière rangée (pas de promotion) : `legalMoves`
  renvoie `[]` sans planter (test tâche 1).
- Pion sur la colonne a ou h : la prise en diagonale ne sort pas du
  plateau (test tâche 1).
- Clic sur une pièce adverse prenable : c'est une prise, pas un
  changement de sélection (test tâche 2).
- Dans `onSquareClick`, lire les cibles **avant** d'effacer la sélection,
  sinon aucun coup n'est jamais émis (test tâche 2 « emits move… »).
- « Réinitialiser » pendant qu'une pièce noire est sélectionnée : plus de
  sélection et tour aux blancs (test tâche 4).

---

## Branche 1 — `feat/16-piece-move-rules` (règles de déplacement)

Mise en place (déjà faite) : `git switch -c feat/16-piece-move-rules dev`.

**Commit 0 (doc)** — ce plan et `AGENT.md` (consignes pour les agents) :

```bash
git add docs/superpowers/plans/2026-11-17-move-rules-and-turns.md AGENT.md
git commit -m "Add plan for move rules and turn order" -m "Refs #16"
```

### Task 1: Déplacements autorisés de chaque pièce (logique pure)

**Files:**
- Modify: `screens/app/utils/chess.ts` (ajout en fin de fichier)
- Modify: `screens/app/utils/pieces.ts:42-44, 61, 70-71` (utiliser `squareToCoords`) + ajout de `Color` / `pieceColor`
- Create: `screens/app/utils/rules.ts`
- Create: `screens/test/helpers/board.ts`
- Test: `screens/test/utils/chess.spec.ts`, `screens/test/utils/pieces.spec.ts`, `screens/test/utils/rules.spec.ts`
- Doc: ce plan (cases cochées)

**Interfaces:**
- Produces (`~/utils/chess`) :
  - `export function squareToCoords(square: Square): [row: number, col: number]`
    — ligne 0 = rangée 8, colonne 0 = colonne a (même repère que la matrice).
  - `export function coordsToSquare(row: number, col: number): Square | undefined`
    — `undefined` hors plateau.
- Produces (`~/utils/pieces`) :
  - `export type Color = 'white' | 'black'` (valeurs de `gameState.turn`).
  - `export function pieceColor(code: PieceCode): Color`
- Produces (`~/utils/rules`) :
  - `export function legalMoves(board: BoardMatrix, from: Square): Square[]`
    — `[]` si `from` est vide. Fonctions privées : `slidingMoves` (fou,
    tour, dame), `singleStepMoves` (roi, cavalier), `pawnMoves`.
- Produces (test) : `boardWith(pieces: Partial<Record<Square, PieceCode>>): BoardMatrix`
  dans `screens/test/helpers/board.ts` (plateau vide + pièces données).

- [x] **Step 1: Write the failing tests**

`chess.spec.ts` — ajouter :

```ts
describe('square coordinates', () => {
  it('maps squares to matrix rows and columns', () => {
    expect(squareToCoords('a8')).toEqual([0, 0])
    expect(squareToCoords('h1')).toEqual([7, 7])
    expect(squareToCoords('e2')).toEqual([6, 4])
    expect(coordsToSquare(6, 4)).toBe('e2')
  })

  it('returns undefined off the board', () => {
    expect(coordsToSquare(-1, 0)).toBeUndefined()
    expect(coordsToSquare(0, 8)).toBeUndefined()
  })
})
```

`pieces.spec.ts` — ajouter :

```ts
describe('pieceColor', () => {
  it('reads the color from the code', () => {
    expect(pieceColor('wK')).toBe('white')
    expect(pieceColor('bP')).toBe('black')
  })
})
```

`rules.spec.ts` (nouveau) — `const moves = (board, from) => legalMoves(board, from).sort()` ;
chaque ligne = un `it` :

| Test | Plateau | Attendu |
|---|---|---|
| lets the e2 pawn advance one or two squares | `initialBoard()`, `e2` | `['e3','e4']` |
| lets the b1 knight jump to a3 and c3 | `initialBoard()`, `b1` | `['a3','c3']` |
| blocks the rook, bishop, queen and king at start | `initialBoard()`, `a1` `c1` `d1` `e1` | `[]` chacun |
| moves black pawns down the board | `initialBoard()`, `e7` | `['e5','e6']` |
| returns nothing for an empty square | `initialBoard()`, `e4` | `[]` |
| pawn cannot move or capture straight ahead | `{e2:'wP', e3:'bP'}`, `e2` | `[]` |
| pawn needs both squares free for the double step | `{e2:'wP', e4:'bP'}`, `e2` | `['e3']` |
| pawn advances one square off its starting rank | `{e3:'wP'}`, `e3` | `['e4']` |
| pawn captures diagonally, never its own color | `{e4:'wP', d5:'bP', f5:'wN', e5:'bP'}`, `e4` | `['d5']` |
| pawn on the edge stays on the board | `{a2:'wP', b3:'bP'}`, `a2` | `['a3','a4','b3']` |
| pawn on the last rank has no move | `{e8:'wP'}`, `e8` | `[]` |
| rook stops before its own piece and on an enemy | `{d4:'wR', d6:'wP', f4:'bP'}`, `d4` | `['a4','b4','c4','d1','d2','d3','d5','e4','f4']` |
| bishop covers its diagonals | `{c1:'wB'}`, `c1` | `['a3','b2','d2','e3','f4','g5','h6']` |
| queen combines rook and bishop | `{d4:'wQ'}`, `d4` | longueur 27 |
| king moves one square, even from a corner | `{a1:'wK'}`, `a1` / `{e4:'bK'}`, `e4` | `['a2','b1','b2']` / longueur 8 |
| knight jumps over pieces but not onto its own | `{b1:'wN', a3:'wP', c2:'bP', d2:'bP'}`, `b1` | `['c3','d2']` |
| knight from a corner | `{h8:'bN'}`, `h8` | `['f7','g6']` |

- [x] **Step 2: Run the tests to verify they fail**

Run: `pnpm test:run test/utils`
Expected: FAIL (`squareToCoords`, `pieceColor`, `~/utils/rules` introuvables).

- [x] **Step 3: Implement** `squareToCoords` / `coordsToSquare` dans
`chess.ts` ; dans `pieces.ts`, supprimer `toIndex` et appeler
`squareToCoords`, ajouter `Color` + `pieceColor` (`code[0] === 'w'`) ;
écrire `rules.ts` :
- directions en objets `{ row, col }` : `ROOK_DIRECTIONS`,
  `BISHOP_DIRECTIONS`, `ALL_DIRECTIONS` (les deux), `KNIGHT_JUMPS` ;
- `isEmpty` / `isEnemy` : petites fonctions de lecture d'une case ;
- `slidingMoves` : pour chaque direction, avancer case par case ; case vide →
  ajoutée ; pièce adverse → ajoutée puis arrêt ; sa couleur ou bord → arrêt ;
- `singleStepMoves` : une case par direction, ajoutée si vide ou adverse ;
- `pawnMoves` : sens `-1` pour les blancs (ligne de départ 6), `+1` pour
  les noirs (ligne de départ 1) ; 1 case si vide, 2 depuis la ligne de
  départ si les deux sont vides, prise à gauche et à droite en avant
  seulement si pièce adverse ;
- `legalMoves` : une suite de `if` sur la lettre de la pièce (`P`, `N`,
  `K`, `B`, `R`, `Q`), `[]` sinon.

- [x] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:run test/utils`
Expected: PASS.

- [x] **Step 5: Doc** — cocher les étapes de la tâche 1 dans ce plan.

- [x] **Step 6: Verify before commit**

Run (depuis `screens/`) : `make lint && make check`
Expected : eslint n'affiche rien ; tous les tests PASS, aucun warning.

- [x] **Step 7: STOP — commit par l'utilisateur**

```bash
git add screens/app/utils/chess.ts screens/app/utils/pieces.ts screens/app/utils/rules.ts \
  screens/test/helpers/board.ts screens/test/utils docs/superpowers/plans/2026-11-17-move-rules-and-turns.md
git commit -m "Add legal move rules for each piece" -m "Refs #16"
```

### Task 2: Le plateau n'accepte que les coups autorisés

**Files:**
- Modify: `screens/app/components/display/Board.vue` (script + classes + style)
- Test: `screens/test/components/display/Board.spec.ts` (nouveau `describe`)
- Modify test: `screens/test/pages/index.spec.ts:19-28` (la prise d1→d8 devient illégale)
- Doc: ce plan (cases cochées)

**Interfaces:**
- Consumes: `legalMoves` (tâche 1), `pieceColor`, `cellAt`, `boardWith` (test).
- Produces: classes CSS `target` (case libre autorisée, un point) et
  `capture` (pièce adverse prenable, un cercle) sur les cases ; `move`
  n'est émis que vers une case de `legalMoves`.
- Comportement de clic (`onSquareClick`) :
  - case de `legalMoves(selected)` → émettre `move`, désélectionner ;
  - sinon, pièce de la même couleur que la pièce sélectionnée (ou
    n'importe quelle pièce si rien n'est sélectionné), autre que la pièce
    sélectionnée → la sélectionner ;
  - sinon → désélectionner.

- [x] **Step 1: Write the failing tests** — dans `Board.spec.ts`, importer
`boardWith` depuis `'../../helpers/board'`, ajouter **en haut du fichier**
(réutilisé en tâche 3)
``const squaresWith = (w: VueWrapper, cls: string) => w.findAll(`.${cls}`).map((e) => e.attributes('data-square')).sort()``
puis un nouveau `describe('Board with move rules')` :

```ts
it('highlights the legal targets of the selected piece', async () => {
  const wrapper = mount(Board, { props: { board: initialBoard() } })
  await wrapper.get('[data-square="e2"]').trigger('click')
  expect(squaresWith(wrapper, 'target')).toEqual(['e3', 'e4'])
  expect(squaresWith(wrapper, 'capture')).toEqual([])
})

it('marks enemy pieces it can capture and captures them', async () => {
  const wrapper = mount(Board, { props: { board: boardWith({ e4: 'wP', d5: 'bP' }) } })
  await wrapper.get('[data-square="e4"]').trigger('click')
  expect(squaresWith(wrapper, 'capture')).toEqual(['d5'])
  expect(squaresWith(wrapper, 'target')).toEqual(['e5'])
  await wrapper.get('[data-square="d5"]').trigger('click')
  expect(wrapper.emitted('move')).toEqual([['e4', 'd5']])
})

it('ignores an illegal destination and clears the selection', async () => {
  const wrapper = mount(Board, { props: { board: initialBoard() } })
  await wrapper.get('[data-square="e2"]').trigger('click')
  await wrapper.get('[data-square="e5"]').trigger('click')
  expect(wrapper.emitted('move')).toBeUndefined()
  expect(wrapper.findAll('.selected, .target')).toHaveLength(0)
})

it('switches the selection to another piece of the same color', async () => {
  const wrapper = mount(Board, { props: { board: initialBoard() } })
  await wrapper.get('[data-square="e2"]').trigger('click')
  await wrapper.get('[data-square="d2"]').trigger('click')
  expect(wrapper.get('[data-square="d2"]').classes()).toContain('selected')
  expect(wrapper.emitted('move')).toBeUndefined()
})

it('does not switch to an enemy piece out of reach', async () => {
  const wrapper = mount(Board, { props: { board: initialBoard() } })
  await wrapper.get('[data-square="e2"]').trigger('click')
  await wrapper.get('[data-square="e7"]').trigger('click')
  expect(wrapper.findAll('.selected')).toHaveLength(0)
})
```

Dans `index.spec.ts`, le test « captures and then resets » joue
`e2→e4`, `d7→d5`, `e4→d5` puis vérifie : 31 pièces, `d5` contient `♙` ;
après « Réinitialiser » : 32 pièces, `d7` contient `♟`, `e2` contient `♙`.

- [x] **Step 2: Run the tests to verify they fail**

Run: `pnpm test:run test/components test/pages`
Expected: FAIL sur les tests qui attendent `target`/`capture`, la prise
et le refus de e2→e5. Les tests « switches… » et « does not switch… »
ainsi que le test de page modifié passent déjà (les coups sont encore
libres) : ils gardent ces comportements verts après l'étape 3.

- [x] **Step 3: Implement** dans `Board.vue` : `targets` = `computed`
(`legalMoves(props.board, selected)` ou `[]`), classes `target` /
`capture` dans `cells`, nouvelle logique de `onSquareClick` (voir
Interfaces ; lire les cibles avant de remettre `selected` à `null`).
Style : `.target::after` = point centré, `.capture` = cercle
(`box-shadow: inset 0 0 0 4px …`), dans la palette existante.

- [x] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:run`
Expected: PASS (tous, y compris les tests existants du plateau et de la page).

- [x] **Step 5: Doc** — cocher les étapes de la tâche 2 dans ce plan.

- [x] **Step 6: Verify before commit**

Run (depuis `screens/`) : `make lint && make check`, puis `make serve` et
vérifier à la main : e2 montre e3/e4, le cavalier b1 montre a3/c3, une prise
affiche un cercle.
Expected : eslint muet, tests PASS sans warning, comportement conforme.

- [x] **Step 7: STOP — commit par l'utilisateur**, puis fin de branche
(push + PR vers `dev` + merge par l'utilisateur ; attendre).

```bash
git add screens/app/components/display/Board.vue screens/test/components/display/Board.spec.ts \
  screens/test/pages/index.spec.ts docs/superpowers/plans/2026-11-17-move-rules-and-turns.md
git commit -m "Restrict board moves to legal targets" -m "Refs #16"
```

### Task 2b: Roque et promotion en dame

Ajouté à la demande de l'utilisateur (« roque + quand un petit pion arrive
de l'autre côté il se transforme en reine, avec du code simple »).

**Files:**
- Modify: `screens/app/utils/rules.ts` (type `Move`, roque dans `legalMoves`, `playMove`)
- Modify: `screens/app/components/display/Board.vue` (prop `history`)
- Modify: `screens/app/pages/index.vue` (historique des coups, `playMove`)
- Test: `screens/test/utils/rules.spec.ts`, `screens/test/components/display/Board.spec.ts`, `screens/test/pages/index.spec.ts`
- Doc: ce plan (cases cochées)

**Interfaces:**
- Produces (`~/utils/rules`) :
  - `export type Move = { from: Square; to: Square }`
  - `legalMoves(board: BoardMatrix, from: Square, history: Move[] = []): Square[]`
    — ajoute g1/c1 (g8/c8) au roi quand le roque est permis.
  - `export function playMove(board: BoardMatrix, from: Square, to: Square): BoardMatrix`
    — `movePiece`, plus : roi qui se déplace de deux colonnes → la tour
    passe de l'autre côté (h→f ou a→d) ; pion qui arrive sur la dernière
    rangée → dame de sa couleur.
- `Board.vue` : prop `history?: Move[]` (défaut `[]`), transmise à `legalMoves`.
- Page : `const history = ref<Move[]>([])`, chaque coup y est ajouté,
  « Réinitialiser » le vide ; les coups sont joués avec `playMove`.
- Règles du roque (simples) : le roi est sur e1 (e8), la tour de sa couleur
  dans le coin, aucun des deux n'apparaît dans `history` (ni en `from` ni en
  `to`), toutes les cases entre eux sont vides. Pas de vérification
  d'échec (l'échec n'existe pas dans le jeu).

- [x] **Step 1: Write the failing tests** — `rules.spec.ts` :
  roque des deux côtés (`{e1:'wK', a1:'wR', h1:'wR'}` → `['c1','d1','d2','e2','f1','f2','g1']`),
  roque noir (`{e8:'bK', h8:'bR'}` → contient `g8`), bloqué par une pièce
  (`g1` occupé → pas `g1` ; `b1` occupé → pas `c1`), refusé si le roi ou la
  tour a déjà bougé (via `history`), refusé sans tour ou avec une tour
  adverse ; `playMove` : petit et grand roque déplacent la tour, promotion
  blanche, noire et avec prise, coup normal identique à `movePiece`.
  `Board.spec.ts` : g1 proposé au roi seulement tant que la tour n'a pas
  bougé. `index.spec.ts` : e4 e5 Cf3 Cc6 Fc4 Cf6 puis e1→g1 → roi en g1,
  tour en f1.
- [x] **Step 2: Run the tests to verify they fail** — `pnpm test:run`.
- [x] **Step 3: Implement** `castlingMoves` (privée, commentée),
  `playMove`, la prop `history` et l'historique de la page.
- [x] **Step 4: Run the tests to verify they pass** — `pnpm test:run`.
- [x] **Step 5: Doc** — cocher les étapes de la tâche 2b dans ce plan.
- [x] **Step 6: Verify before commit** — `make lint && make check`, puis
  essai dans le navigateur (roque et promotion).
- [x] **Step 7: Commit (un seul)** — `Add castling and queen promotion`, `Refs #16`.

### Task 2c: Le joueur choisit la pièce de promotion

Demandé par l'utilisateur : au lieu d'une dame automatique, le joueur
choisit en quelle pièce son pion se transforme.

**Files:**
- Modify: `screens/app/utils/rules.ts` (`PromotionPiece`, `PROMOTION_PIECES`, `isPromotion`, `promotedPiece`, `playMove` avec un choix)
- Modify: `screens/app/components/display/Board.vue` (panneau de choix)
- Modify: `screens/app/pages/index.vue` (transmet le choix à `playMove`)
- Test: `screens/test/utils/rules.spec.ts`, `screens/test/components/display/Board.spec.ts`, `screens/test/pages/index.spec.ts`

**Interfaces:**
- `export type PromotionPiece = 'Q' | 'R' | 'B' | 'N'` et
  `export const PROMOTION_PIECES: PromotionPiece[] = ['Q', 'R', 'B', 'N']`.
- `export function isPromotion(board, from, to): boolean` — un pion blanc
  qui arrive sur la rangée 8, ou un pion noir sur la rangée 1.
- `export function promotedPiece(pawn: PieceCode, choice: PromotionPiece): PieceCode`
  — `('wP', 'N')` → `'wN'`.
- `playMove(board, from, to, promotion: PromotionPiece = 'Q')`.
- `Board.vue` : event `move: [from, to, promotion?]`. Un coup de promotion
  n'est pas émis tout de suite : un panneau (`.promotion`, boutons
  `[data-promotion="Q|R|B|N"]` et `[data-testid="promotion-cancel"]`)
  propose les 4 pièces de la couleur du pion. Choisir → émettre le coup
  avec la pièce ; « Annuler » ou un clic sur le plateau → rien n'est joué.
- Page : `onMove(from, to, promotion)` → `playMove(board, from, to, promotion)`.

- [x] **Step 1: Write the failing tests** — `isPromotion`, `promotedPiece`,
  `playMove` avec cavalier / tour ; panneau du plateau (choix et
  annulation) ; page : a4 h6 a5 h5 a6 h4 axb7 h3 bxa8 puis cavalier → `♘` en a8.
- [x] **Step 2: Run the tests to verify they fail** — `pnpm test:run`.
- [x] **Step 3: Implement**.
- [x] **Step 4: Run the tests to verify they pass** — `pnpm test:run`.
- [x] **Step 5: Doc** — cocher les étapes de la tâche 2c.
- [x] **Step 6: Verify before commit** — `make lint && make check` + navigateur.
- [x] **Step 7: Commit (un seul)** — `Let the player choose the promotion piece`, `Refs #16`.

---

## Branche 2 — `feat/16-turn-order` (tour par tour)

Après le merge de la branche 1 :
`git switch dev && git pull && git switch -c feat/16-turn-order`.

### Task 3: Seul le camp dont c'est le tour peut sélectionner

> Réalisée dans le même commit que la tâche 4 : seule, elle cassait la page
> (les noirs ne pouvaient plus jouer tant que la page ne passait pas `turn`).

**Files:**
- Modify: `screens/app/components/display/Board.vue` (prop `turn`, règle de sélection)
- Test: `screens/test/components/display/Board.spec.ts`
- Doc: ce plan (cases cochées)

**Interfaces:**
- Consumes: `Color`, `pieceColor` (tâche 1).
- Produces: prop `turn?: Color`, défaut `'white'` (le test `mount(Board)`
  sans prop reste vert). Une pièce n'est sélectionnable que si
  `pieceColor(code) === turn` ; cette règle remplace « même couleur que la
  pièce sélectionnée » de la tâche 2.

- [x] **Step 1: Write the failing tests** — nouveau `describe('Board turn')` :

```ts
it('only lets white pick a piece by default', async () => {
  const wrapper = mount(Board, { props: { board: initialBoard() } })
  await wrapper.get('[data-square="e7"]').trigger('click')
  expect(wrapper.findAll('.selected')).toHaveLength(0)
  await wrapper.get('[data-square="e2"]').trigger('click')
  expect(wrapper.get('[data-square="e2"]').classes()).toContain('selected')
})

it('only lets black pick a piece on their turn', async () => {
  const wrapper = mount(Board, { props: { board: initialBoard(), turn: 'black' } })
  await wrapper.get('[data-square="e2"]').trigger('click')
  expect(wrapper.findAll('.selected')).toHaveLength(0)
  await wrapper.get('[data-square="e7"]').trigger('click')
  expect(squaresWith(wrapper, 'target')).toEqual(['e5', 'e6'])
})
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `pnpm test:run test/components`
Expected: FAIL sur les deux nouveaux tests (e7 sélectionnable par défaut).

- [x] **Step 3: Implement** la prop `turn` et la règle de sélection.

- [x] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:run`
Expected: PASS (tous).

- [x] **Step 5: Doc** — cocher les étapes de la tâche 3 dans ce plan.

- [x] **Step 6: Verify before commit** — `make lint && make check`, muets / PASS.

- [x] **Step 7: STOP — commit par l'utilisateur**

```bash
git add screens/app/components/display/Board.vue screens/test/components/display/Board.spec.ts docs/superpowers/plans/2026-11-17-move-rules-and-turns.md
git commit -m "Let only the side to move pick a piece" -m "Refs #16"
```

### Task 4: La page alterne les tours et affiche qui doit jouer

**Files:**
- Modify: `screens/app/pages/index.vue`
- Test: `screens/test/pages/index.spec.ts` (nouveaux tests + mise à jour de « clears a pending selection on reset »)
- Doc: ce plan (cases cochées)

**Interfaces:**
- Consumes: `Color` (tâche 1) ; `<DisplayBoard :board :turn @move>` (tâche 3).
- Produces: `const turn = ref<Color>('white')` ; après chaque `move` :
  coup appliqué puis tour à l'autre camp ; « Réinitialiser » remet
  `initialBoard()` et `'white'`. Indicateur au-dessus du plateau :
  `<p class="turn" data-testid="turn" aria-live="polite">` avec le texte
  exact « Au tour des blancs » / « Au tour des noirs ».

- [x] **Step 1: Write the failing tests** dans `index.spec.ts` :

```ts
it('starts with white to move', async () => {
  const page = await mountSuspended(IndexPage)
  expect(page.get('[data-testid="turn"]').text()).toBe('Au tour des blancs')
})

it('gives the turn to black after a white move', async () => {
  const page = await mountSuspended(IndexPage)
  await page.get('[data-square="e2"]').trigger('click')
  await page.get('[data-square="e4"]').trigger('click')
  expect(page.get('[data-testid="turn"]').text()).toBe('Au tour des noirs')
  await page.get('[data-square="e4"]').trigger('click')
  expect(page.findAll('.selected')).toHaveLength(0)
})

it('keeps the turn after an illegal click', async () => {
  const page = await mountSuspended(IndexPage)
  await page.get('[data-square="e2"]').trigger('click')
  await page.get('[data-square="e5"]').trigger('click')
  expect(page.get('[data-testid="turn"]').text()).toBe('Au tour des blancs')
  expect(page.get('[data-square="e2"]').text()).toContain('♙')
})

it('gives the turn back to white on reset', async () => {
  const page = await mountSuspended(IndexPage)
  await page.get('[data-square="e2"]').trigger('click')
  await page.get('[data-square="e4"]').trigger('click')
  await page.get('[data-testid="reset"]').trigger('click')
  expect(page.get('[data-testid="turn"]').text()).toBe('Au tour des blancs')
})
```

Mettre à jour « clears a pending selection on reset » : `e2→e4`, puis
sélectionner `e7` (noir), « Réinitialiser » → aucune `.selected`, puis
un clic sur `d2` la sélectionne.

- [x] **Step 2: Run the tests to verify they fail**

Run: `pnpm test:run test/pages`
Expected: FAIL (pas d'indicateur `data-testid="turn"`, e7 non sélectionnable après e2→e4).

- [x] **Step 3: Implement** l'état `turn`, le changement de tour dans
`onMove`, la remise à `'white'` dans `reset`, l'indicateur et `:turn` sur
`<DisplayBoard>`.

- [x] **Step 4: Run the tests to verify they pass**

Run: `pnpm test:run`
Expected: PASS (tous).

- [x] **Step 5: Doc** — cocher les étapes de la tâche 4 dans ce plan.

- [x] **Step 6: Verify before commit** — `make lint && make check`, puis
`make serve` : jouer e2-e4, d7-d5, e4xd5 et vérifier l'indicateur à chaque coup.

- [x] **Step 7: STOP — commit par l'utilisateur**, puis fin de branche
(push + PR vers `dev` + merge par l'utilisateur).

```bash
git add screens/app/pages/index.vue screens/test/pages/index.spec.ts docs/superpowers/plans/2026-11-17-move-rules-and-turns.md
git commit -m "Alternate turns and show whose turn it is" -m "Refs #16"
```
