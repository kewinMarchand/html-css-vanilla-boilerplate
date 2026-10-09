# html-css-vanilla-boilerplate

Point de départ pour un site en **HTML, CSS et JavaScript natifs**, sans framework, sans bundler et sans étape de build. Les fichiers servis sont ceux du dépôt. L'outillage (validation, format, tests, Lighthouse) ne sert qu'au développement.

| Page                | Ce qu'elle montre                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `/`                 | Hero pleine largeur avec photo LCP, carrousel Embla au glisser, grille de blog en requêtes de conteneur |
| `/catalogue`        | Catalogue à facettes : filtres dans l'URL, comptage disjonctif, tri, grille ou liste, pagination        |
| `/catalogue/...`    | 14 pages de catégorie statiques sur 3 niveaux, menu en cascade (desktop) ou par niveaux (mobile)        |
| `/taches`           | Chargement en JavaScript avec ses trois états : chargement, erreur avec relance, liste vide             |
| `/contact`          | Formulaire en amélioration progressive, erreurs liées aux champs, confirmation annoncée, modale native  |
| Pages légales       | Mentions légales, données personnelles, déclaration d'accessibilité, plan du site                       |
| `/charte-graphique` | Tokens, typographie, composants et états, en développement seulement                                    |
| 404, 405, 500, 503  | Pages d'erreur dans le layout du site, avec le vrai code HTTP                                           |

## Stack

| Brique                             | Rôle                                                                |
| ---------------------------------- | ------------------------------------------------------------------- |
| HTML statique                      | Une page par fichier, URL propres (`taches/index.html` → `/taches`) |
| CSS natif, un seul fichier         | `site/css/main.css`, rangé en couches `@layer`                      |
| Modules ES natifs                  | Un fichier par comportement, chargés en `type="module"`             |
| Embla Carousel 8                   | Seule dépendance d'exécution, servie depuis `site/vendor/`          |
| `scripts/serve.js`                 | Serveur statique de développement, sans dépendance                  |
| html-validate, stylelint, Prettier | Validation HTML, CSS et format                                      |
| `node:test`                        | Tests unitaires, sans dépendance                                    |
| Playwright + axe-core              | Tests end-to-end et accessibilité, desktop et mobile, deux modes    |
| Lighthouse CI                      | Performance, accessibilité, SEO                                     |
| nginx (Docker)                     | Production : URL propres, pages d'erreur, CSP stricte, maintenance  |

## Prérequis

- Node.js 24.14 ou plus (`.nvmrc`), Yarn 1, pour l'outillage seulement
- Docker, pour l'image de production (optionnel)

## Démarrage

```sh
git clone https://github.com/kewinMarchand/html-css-vanilla-boilerplate.git
cd html-css-vanilla-boilerplate
make install   # dépendances, copie d'Embla dans site/vendor, Chromium des tests
make up        # http://localhost:3130
```

L'URL publique est `https://www.example.com` (domaine réservé aux exemples). Elle apparaît dans les balises canoniques, Open Graph, JSON-LD, `sitemap.xml` et `robots.txt`, et dans `site.config.json`. Remplacez-la partout avant une mise en ligne.

## Commandes

`make help` liste toutes les commandes. Les principales :

| Commande                               | Effet                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `make up`                              | Serveur de développement sur le port 3130                                                        |
| `make qa`                              | QA rapide : html-validate, stylelint, Prettier, tests unitaires                                  |
| `make qa-full`                         | QA complète : QA rapide, e2e, accessibilité, Lighthouse, image de production                     |
| `make test-e2e`                        | Playwright, desktop et mobile                                                                    |
| `make test-a11y`                       | axe-core, WCAG 2.1 AA, chaque page dans les deux modes d'affichage                               |
| `make metrics`                         | Lighthouse CI sur le port 3250 : échoue sous 90 en performance, sous 100 en accessibilité et SEO |
| `make test-prod`                       | Construit l'image nginx et vérifie codes HTTP, en-têtes et mode maintenance                      |
| `make docker-build` / `make docker-up` | Image de production, sur le port `PORT` (8080 par défaut)                                        |

## Architecture

```
site/                        racine servie telle quelle
  index.html, */index.html   une page par route, header et footer recopiés dans chaque page
  404.html, 50x.html, 503.html
  css/main.css               feuille unique : reset, tokens, base, layout, components, utilities
  js/
    core/                    socle : mode renforcé, menu de catégories, modale
    features/carousel/       brique agnostique, seul fichier qui importe Embla
    domains/<domaine>/
      api/                   données en mémoire avec latence
      common/models/         fonctions pures, testées unitairement
      common/exceptions/     erreurs métier en français
      ui/                    branchement au DOM de la page
  vendor/                    Embla, copié par `yarn install` (non versionné)
  images/, icons/            médias AVIF et WebP, sprite d'icônes SVG
lib/                         fonctions d'outillage testées (fil d'Ariane, conformité RGAA)
scripts/                     serveur de développement, copie d'Embla, contrôle de l'image de prod
docker/                      configuration nginx et en-têtes de sécurité
tests/unit, tests/e2e, tests/a11y
site.config.json             nom, URL, navigation, éditeur, hébergeur, état d'audit
```

Le sens des dépendances est `domains/` vers `features/` vers `core/`. Une feature ne connaît aucune donnée métier : le carrousel reçoit ses diapositives dans le HTML.

### Sans build : ce qui est assumé

- **Header et footer sont recopiés dans chaque page.** Pas d'include côté serveur ni de générateur. Pour qu'une copie ne dérive pas, `tests/unit/pages.test.js` vérifie sur toutes les pages : navigation et liens légaux identiques à `site.config.json`, fil d'Ariane et JSON-LD conformes au calcul de `lib/breadcrumb.js`, titre et description dans les bonnes longueurs, canonique, hash du script inline présent dans la CSP, sitemap et plan du site complets, informations légales reprises de la configuration.
- **Le catalogue est rendu en entier dans le HTML** (contenu indexable). Le module `catalog.js` lit l'URL, filtre, trie et pagine côté client en réordonnant les cartes existantes. Sans JavaScript, la liste complète reste visible et le formulaire `GET` place les filtres dans l'URL sans les appliquer : limite assumée d'un site sans serveur applicatif.
- **Le formulaire de contact ne s'envoie qu'avec JavaScript.** Il n'y a pas de serveur pour traiter un envoi. Sans JavaScript, un message au-dessus du formulaire l'annonce et donne l'adresse e-mail, et le `POST` natif reçoit une page française en 405 (`site/405.html`, servie par nginx et par `scripts/serve.js`).
- **Les balises `robots` et canonique des pages filtrées** sont mises à jour par le script. Un robot sans JavaScript voit la page de catégorie indexable, dont la canonique est déjà la version sans filtre.

## Recettes

### Ajouter une page

1. Copier une page existante proche, par exemple `site/contact/index.html`, vers `site/<route>/index.html`.
2. Adapter `<title>`, description, canonique, Open Graph, JSON-LD `BreadcrumbList`, fil d'Ariane et `<h1>`.
3. Si elle entre dans la navigation, l'ajouter à `site.config.json` puis à la navigation de **chaque** page. `make test-unit` liste les pages oubliées.
4. L'ajouter à `sitemap.xml` et au plan du site, à `.lighthouserc.json` si elle doit être mesurée.
5. Écrire son test dans `tests/e2e/`.

### Changer le script inline du `<head>`

Il pose `data-js` et le mode renforcé avant le premier rendu. La CSP l'autorise par son hash : après toute modification, `make test-unit` affiche le nouveau hash attendu, à reporter dans `docker/security-headers.conf`.

### Brancher la vraie API

Seuls les fichiers `api/` des domaines changent : `tasksRepository.js`, `catalogRepository.js`, `sendContactMessage.js`. Le paramètre d'URL `scenario=error|empty` des démos devient l'en-tête `X-Scenario` de l'API de test.

## CSS natif utilisé

| Fonctionnalité                   | Où                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| `@layer`                         | Ordre global en tête de `main.css`                                                        |
| Imbrication native               | Partout (`&:hover`, `@media` imbriqués)                                                   |
| `@container`                     | Carte de blog, diapositive du carrousel, carte produit (grille ou liste)                  |
| `:has()`                         | Blog vide, champ en erreur, largeur du menu en cascade, défilement bloqué sous une modale |
| `:focus-visible`                 | Focus global, épaissi en mode renforcé                                                    |
| `oklch()`, `color-mix()`         | Tous les tokens de couleur, survols, surlignage                                           |
| `light-dark()` et `color-scheme` | Tokens clair et sombre, forcés en clair dans le mode renforcé                             |
| `clamp()`                        | Taille du `<h1>`                                                                          |
| Propriétés logiques              | Marges, bordures, positionnement (`inset-inline-start`, `margin-block`)                   |
| `text-wrap: balance` et `pretty` | Titres et paragraphes                                                                     |
| `prefers-reduced-motion`         | Transitions de page, squelettes, modale, défilement                                       |
| `scroll-snap`                    | Carrousel sans JavaScript                                                                 |
| `subgrid`                        | Colonnes alignées de la liste de tâches                                                   |
| `@view-transition`               | Transition entre pages, coupée en mode renforcé et sous mouvement réduit                  |

## Mode accessibilité renforcée

Le bouton de l'en-tête pose `data-a11y-mode="enhanced"` sur `<html>`, mémorisé en `localStorage` (clé `a11y-mode`). Tout est en CSS par surcharge de tokens : texte de base à 20 px, contraste `#000` sur `#fff` et primaire AAA, liens soulignés, focus de 4 px, animations coupées. Les espacements de texte WCAG 1.4.12 ne s'appliquent qu'au contenu de `<main>`, jamais au header, à la navigation, aux boutons ni au footer.

## Production

L'image `nginx:1.29-alpine` sert `site/`, sans la charte graphique ni son script (`.dockerignore`) :

- URL propres par `try_files $uri $uri/index.html`, 404 personnalisée, 500/502/504 sur `50x.html`.
- En-têtes de sécurité partagés avec le serveur de développement (`docker/security-headers.conf`), dont une CSP sans `unsafe-inline`.
- Maintenance : `MAINTENANCE=1 make docker-up` répond 503 avec `Retry-After` sur toutes les pages, les fichiers statiques restant servis.
- La route `/_erreur-test`, qui déclenche la 500, n'existe que dans le serveur de développement.

## Tests

- **Unitaires** : `tests/unit/`, fonctions pures (catalogue, tâches, formulaire, mode renforcé, contraste, fil d'Ariane, conformité) et cohérence des pages statiques.
- **End-to-end** : un fichier par page ou par brique, ciblage par `data-testid`, rendus conditionnels testés présents et absents, scénarios sans JavaScript pour le carrousel et le catalogue, absence de débordement à 375, 768 et 1280 px dans les deux modes.
- **Accessibilité** : axe-core sur chaque route, les pages d'erreur, la charte, le catalogue filtré et le menu ouvert, dans les deux modes. Axe ne couvre qu'une partie du RGAA : la déclaration reste « non conforme » tant qu'aucun audit n'est renseigné dans `site.config.json`.

## Licence

MIT
