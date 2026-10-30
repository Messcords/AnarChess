# Contribuer à AnarChess

## Proposer une modification

1. Créez une branche à partir de `dev` (voir [Nommage des branches](#nommage-des-branches)).
2. Réalisez vos modifications.
3. Vérifiez qu’elles fonctionnent : exécutez les tests et le lint.
4. Ouvrez une pull request vers `dev`, avec une description claire de vos changements.

## Merge d’une pull request

Une pull request peut être fusionnée uniquement si les conditions suivantes sont réunies :

- **Revue par une autre personne** : l’auteur ne peut pas approuver sa propre PR.
- **Une seule approbation** suffit.
- **Approbation par le bon pôle** : une PR backend est approuvée par un membre du backend, une PR frontend par un membre du frontend.
- **CI verte** : tous les checks doivent passer.
- **Critères d’acceptation validés** : la personne qui relit vérifie que les critères d’acceptation de l’issue sont remplis.

Une PR est considérée comme prête lorsqu’elle a été relue et approuvée par une autre personne, et que cette dernière a validé les critères d’acceptation.

## Contrat d’API

Le contrat d’API entre le frontend et le backend est décrit dans [docs/api-contract.md](docs/api-contract.md). C’est la référence commune : le front et le back doivent s’y conformer.

### Qui peut le modifier ?

Seul le **responsable du contrat** peut le modifier, en accord avec l’équipe.

### Comment prévenir d’un changement ?

Toute modification du contrat passe par une **pull request dédiée**, qui ne contient que le changement de contrat. Elle doit être approuvée par **un membre du frontend et un membre du backend** avant d’être fusionnée.

## Conventions

### Nommage des branches

Les noms de branches sont écrits en anglais, au format :

```
<type>/<numéro-de-l-issue>-<courte-description>
```

- `type` : `feat` (nouvelle fonctionnalité) ou `fix` (correction de bug).
- Exemple : `feat/8-add-login`

### Taille des branches

Une branche doit représenter **une journée de travail maximum**. Si le travail est plus long, découpez-le en plusieurs issues et en plusieurs branches plus petites.

### Messages de commit

Les messages de commit sont écrits en anglais :

- **Titre** : 50 caractères maximum, qui résume le changement.
- **Corps** (optionnel) : lignes de 72 caractères maximum, séparées du titre par une ligne vide. Expliquez :
  - pourquoi le changement est nécessaire (objectif, cas d’usage, story) ;
  - comment il répond au problème ;
  - les éventuels effets de bord.

Exemple :

```
Add login form

Players need to sign in to keep track of their stats.
Add a form that calls the authentication endpoint.
```
