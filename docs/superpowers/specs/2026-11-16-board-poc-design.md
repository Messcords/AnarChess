# POC — Plateau d'échecs 2D (front uniquement)

Date : 2026-11-16
Taille : petit changement

## Intention

Avoir rapidement un **aperçu visuel** de ce que fera le jeu : une page qui
affiche un plateau d'échecs 8×8 avec ses pièces en 2D, et sur laquelle on
peut déplacer les pièces. C'est un premier jet pour se projeter, pas la
version finale.

## Objectifs

- Afficher un plateau 8×8 en position de départ classique, blancs en bas.
- Afficher les coordonnées (a–h, 1–8) autour du plateau.
- Pouvoir déplacer n'importe quelle pièce vers n'importe quelle case.
- Si la case d'arrivée est occupée, la pièce qui s'y trouve est capturée
  (retirée du plateau).

## Hors périmètre

- Aucun backend, aucun appel API, aucune liaison avec `endpoints/`.
- Aucune règle d'échecs (déplacements libres, pas d'alternance des tours,
  pas d'échec / mat).
- Pas de Bouffon (`jester_piece`) dans ce POC.
- Pas de glisser-déposer, pas d'animation.

## Anti-objectifs

- Ajouter une librairie d'échecs qui imposerait les règles classiques ou son
  propre format de données (bloquerait le Bouffon et les règles « anarchie »).

## Contraintes

- Front : projet Nuxt 4 dans `screens/` (code dans `screens/app/`), tests
  avec Vitest + `@nuxt/test-utils`.
- Conventions du projet : branche `feat/<issue>-<description>` en anglais,
  commits en anglais (titre ≤ 50 caractères).

## Approches envisagées

1. **Composant maison, déplacement en deux clics** — grille CSS 8×8, pièces
   en caractères Unicode (♔♕♖♗♘♙ / ♚♛♜♝♞♟), on clique une pièce (case
   surlignée) puis la case d'arrivée. Zéro dépendance, peu de fichiers,
   fonctionne au tactile, réutilisable comme base du vrai plateau.
   **→ Retenue.**
2. Composant maison en glisser-déposer HTML5 — plus naturel à la souris,
   mais plus de code et ne marche pas au tactile sans travail en plus.
3. Librairie toute faite (vue3-chessboard, chessground) — rendu et
   animations immédiats, mais impose les règles classiques et son format ;
   probablement à jeter plus tard.

## Design

- **Modèle de données** : l'état local est le `Board` du contrat
  `docs/openapi.yaml` : une matrice 8×8 de codes de pièces (`"wK"`, `"bP"`…,
  couleur `w|b` + `K Q R B N P`) ou `""` pour une case vide. Ligne 0 = rangée
  8, colonne 0 = colonne a. Le branchement au back plus tard n'aura pas à
  convertir de format.
- **Logique pure** (fichier TypeScript sans Vue) : position de départ,
  conversion case ↔ ligne/colonne, déplacement d'une pièce avec capture.
  Testée unitairement.
- **Composant plateau** : `screens/app/components/display/Board.vue`.
  Affiche la grille, gère la sélection (clic sur une pièce → surlignage ;
  re-clic sur la même pièce → désélection ; clic sur une autre case →
  déplacement). Placé là pour que le test de
  `test/display-board` (`@/components/display/Board.vue`) puisse être repris
  tel quel.
- **Page** : la page d'accueil affiche le plateau à la place de
  `NuxtWelcome`, avec un bouton « Réinitialiser » qui remet la position de
  départ.
- **Rendu des pièces** : caractères Unicode ; remplaçables plus tard par des
  SVG sans toucher à la logique.

## Choix laissés au développeur

- Couleurs des cases et taille du plateau (responsive, lisible sur mobile).
- Organisation exacte des fichiers de logique et des tests.
