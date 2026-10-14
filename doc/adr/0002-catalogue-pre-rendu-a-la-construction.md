# 0002 — Catalogue pré-rendu à la construction de l'image

- **Statut** : Proposée
- **Date** : 2026-10-14
- **Décideurs** : Kewin Marchand
- **Complète** : ADR 0001, sur un point de son contexte (« aucune étape de build »). Les inclusions côté serveur ne changent pas.

## Contexte

Depuis le branchement de l'API, les pages de catégories (`site/catalogue/**/index.html`) sont statiques mais vides : la liste des produits, ses compteurs et ses facettes sont lus dans l'API par le navigateur. Le HTML servi ne contient aucun produit. Un robot qui n'exécute pas le JavaScript, ou l'exécute tard, ne voit qu'un squelette de chargement, et la liste structurée des produits (JSON-LD `ItemList`) a disparu. Les autres boilerplates rendent cette première page côté serveur.

L'ADR 0001 refuse un générateur statique pour assembler le header et le footer, et le dépôt pose « aucune étape de build » comme principe. Mais le site servi n'est déjà plus `site/` tel quel (nginx l'assemble), et l'image de production a déjà une étape Node (copie des dépendances dans `site/vendor/`).

## Décision

On pré-rend la première page de chaque catégorie à la construction de l'image de production, et seulement là.

- Une étape Node du `Dockerfile` lance `scripts/prerender-catalog.js` sur `site/`, avec `API_URL` passé en argument de construction (`compose.yaml` et `make test-prod` construisent sur le réseau de la machine pour joindre l'API locale).
- Pour chaque page de catégorie, le script lit la première page de produits sans filtre et l'écrit dans le HTML : produits (à partir du `<template>` de la page, le même que celui du navigateur), nombre de résultats, compteurs des facettes, `<link rel="next">` et JSON-LD `ItemList`. Le squelette de chargement est retiré, et le `<noscript>` dit que seule la première page s'affiche sans JavaScript.
- Il réutilise la traduction de l'API, le prix et les libellés des modules : aucune règle n'est écrite deux fois.
- API injoignable à la construction : la page reste telle quelle (rendue dans le navigateur, comme avant) et le script l'annonce. Une erreur de rendu fait échouer la construction.
- Dans le navigateur, le catalogue relit l'API au chargement : une page pré-rendue est actualisée sans squelette, et garde ses produits si l'actualisation échoue. Une URL filtrée, triée ou paginée affiche le squelette jusqu'à la réponse.
- Les sources de `site/` ne changent pas : le serveur de développement, les tests unitaires et e2e et Lighthouse servent toujours le site sans pré-rendu. `make test-prod` vérifie le pré-rendu dans l'image.

## Alternatives envisagées

- **Garder le rendu dans le navigateur seul** : zéro outillage, mais le catalogue reste invisible dans le HTML servi, ce qui contredit la raison d'être d'un site de contenu.
- **Pré-rendu à la volée par nginx** (SSI `include virtual` vers l'API) : l'API répond en JSON, nginx ne sait pas le transformer en HTML sans module de script (njs), ce qui ajoute un langage et une dépendance d'exécution.
- **Générateur statique complet (Eleventy, Astro)** : même bénéfice, mais tout le site passerait par l'outil, avec une dépendance lourde et un écart entre sources et site servi bien plus large que pour le seul catalogue.
- **Pré-rendre toutes les pages de pagination et combinaisons de filtres** : le nombre de fichiers explose avec les filtres, pour des pages déjà marquées `noindex`. La première page sans filtre suffit au référencement.

## Conséquences

- **Positives** :
  - chaque page de catégorie sert ses premiers produits et leur JSON-LD, lisibles sans JavaScript et par les robots ;
  - le premier affichage n'attend plus l'API : ni squelette ni décalage de mise en page (CLS mesuré à 0) ;
  - le balisage d'un produit n'existe qu'une fois, dans le `<template>` de la page.
- **Négatives / coûts** :
  - la construction de l'image dépend de l'API : sans elle, le site part comme avant, sans pré-rendu ;
  - les données écrites sont figées jusqu'à la reconstruction de l'image (nginx ne régénère rien). Le navigateur les actualise au chargement, mais un robot voit l'état de la construction ;
  - le site servi s'écarte un peu plus des sources : le développement ne montre pas le pré-rendu, seul `make test-prod` le vérifie ;
  - les pages 2 et suivantes, et les filtres, restent rendus dans le navigateur ;
  - le script remplace des fragments de HTML par expressions régulières, ancrés sur les attributs `data-` du catalogue : renommer l'un d'eux impose de mettre le script à jour (les tests unitaires de `tests/unit/prerenderCatalog.test.js` échouent sinon).
- **Suivi** : rouvrir la décision si les données doivent être fraîches pour les robots (régénération planifiée de l'image, ou serveur applicatif), ou si d'autres pages demandent un pré-rendu (un générateur deviendrait alors plus simple).
