# Jeu d'échecs — Carte de traçabilité

Ce document relie chaque user story aux écrans qui la portent et aux endpoints qui alimentent ces écrans, avec sa priorité MoSCoW.

```
Story → Écran → Endpoint
```

> Terminologie : dans le modèle du jeu, le troisième joueur est nommé « Bouffon » (roi).

> Les écrans et les endpoints ci-dessous sont des propositions de départ, à valider ou à remplacer par ceux du projet.

## Carte de traçabilité

Les stories sont listées dans un ordre de livraison valide : une story n'apparaît qu'après celles dont elle dépend.

| Story | Priorité | Dépend de | Écran | Endpoint |
| --- | --- | --- | --- | --- |
| **US1** — En tant que joueur, je veux pouvoir voir le plateau et ses pièces afin de connaître l'état de la partie | Must | — | Plateau | `GET /games/{id}/status` |
| **US2** — En tant que joueur, je veux déplacer les pièces conformément à leurs règles afin de jouer une partie d'échecs | Must | US1 | Plateau | `POST /games`<br>`POST /games/{id}/moves` |
| **US4** — En tant que joueur, je veux consulter les événements et leurs effets sur le plateau afin de comprendre ce qui se passe pendant la partie | Must | US2, US1 | Plateau | `GET /games/{id}/events` |
| **US3** — En tant que joueur, je veux affronter un autre joueur humain afin de jouer avec quelqu'un | Must | US2, US1 | Lobby, Plateau | `POST /games/{id}/join`<br>`WS /games/{id}` |
| **US5** — En tant que joueur, je veux que la partie se termine lorsqu'un joueur n'a plus de pièce sur le plateau afin que la victoire soit déterminée clairement | Must | US1, US2 | Plateau, Résultat | `GET /games/{id}` |
| **US6** — En tant que joueur, je veux que l'issue d'une partie puisse dépendre de règles spécifiques afin de varier les conditions de victoire | Should | US5 | Résultat | `GET /rulesets`<br>`POST /games` (paramètre `ruleset`) |
| **US9** — En tant que joueur, je veux me connecter afin de suivre mes statistiques | Won't | US5 | Connexion, Profil | `POST /auth/login`<br>`GET /players/me/stats` |
| **US7** — En tant que joueur, je veux affronter différents Bouffons afin de progresser dans le mode histoire | Won't | US6 | Carte des Bouffons | `GET /story/jesters`<br>`POST /story/jesters/{id}/games` |
| **US8** — En tant que joueur, je veux affronter des joueurs de niveau Elo similaire afin de progresser dans le classement | Won't | US3, US9 | File d'attente, Classement | `POST /matchmaking/queue`<br>`GET /leaderboard` |

### Légende des priorités (MoSCoW)

- **Must** : indispensable à la première livraison.
- **Should** : important, mais la livraison fonctionne sans.
- **Won't** : hors périmètre de cette itération.

### Points d'attention

- L'écran **Plateau** est partagé par US1, US2, US3 et US4 : toute évolution de son contrat touche plusieurs stories à la fois.
- `POST /games` sert à la fois US1 et US5 : le paramètre `ruleset` est à prévoir dès US1.
- L'authentification n'arrive qu'avec US8 et US7 (toutes deux Won't) : les endpoints des stories Must ne doivent pas en dépendre.
