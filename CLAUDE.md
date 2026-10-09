# CLAUDE.md — html-css-vanilla-boilerplate

Boilerplate personnel. Les conventions générales sont dans `~/.claude/CLAUDE.md` : ce fichier ne note que les choix propres au projet.

## Choix du projet

- **Type** : site statique HTML, CSS et JavaScript natifs, sans framework ni étape de build. `site/` est servi tel quel.
- **Pages** : une page par fichier (`<route>/index.html`). Header, footer, `<head>` SEO et fil d'Ariane sont recopiés dans chaque page. Ils ont été produits une première fois par un script d'amorçage non versionné : toute modification se fait désormais à la main, page par page, et `tests/unit/pages.test.js` signale les copies qui divergent de `site.config.json` et de `lib/`.
- **CSS** : une seule feuille, `site/css/main.css`, rangée en blocs `@layer`. Pas d'`@import` : chaque import ajoutait un aller-retour bloquant le rendu, mesuré sur Lighthouse mobile (accueil à 90 avec 17 imports, 95 à 100 en fichier unique).
- **JavaScript** : modules ES natifs, un fichier par comportement. Les fonctions pures vivent dans `common/models/` et sont testées par `node:test`.
- **Amélioration progressive** : le script inline du `<head>` pose `data-js` sur `<html>`. Le CSS bascule les éléments qui dépendent du JavaScript (boutons de menu, contrôles du carrousel, bouton Filtrer) sur `:root[data-js]` plutôt que sur l'attribut `hidden`, pour éviter tout décalage de mise en page (CLS).
- **Unité de police** : `px`. Police système, aucune police web.
- **Langue** : français uniquement. URL en français.
- **Cibles tactiles** : 44 px minimum (`--tap-target`).
- **API** : aucune. Les dépôts `api/` renvoient des données en mémoire. Le jeu du catalogue reprend les fixtures de `api-platform-test-api`.
- **URL publique** : `https://www.example.com`, à remplacer partout avant une mise en ligne.

## Dépendances, et pourquoi

| Paquet                                   | Type      | Raison                                                                                                                                                                                                                                                          |
| ---------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `embla-carousel` `^8`                    | exécution | Glisser souris, swipe, boutons et pagination du carrousel. Seul import : `features/carousel/carousel.js`. Le build ESM est copié dans `site/vendor/` par `scripts/vendor.js` (`postinstall`), sans bundler ni CDN, pour rester sous la CSP `script-src 'self'`. |
| `@playwright/test` `~1.63`               | dev       | Version calée sur le Chromium installé localement (`chromium-1243`). Changer de version impose `npx playwright install chromium`.                                                                                                                               |
| `@axe-core/playwright`                   | dev       | Audit WCAG 2.1 AA dans Playwright                                                                                                                                                                                                                               |
| `@lhci/cli`                              | dev       | Lighthouse CI                                                                                                                                                                                                                                                   |
| `html-validate`                          | dev       | Validation HTML                                                                                                                                                                                                                                                 |
| `stylelint`, `stylelint-config-standard` | dev       | Validation CSS                                                                                                                                                                                                                                                  |
| `prettier`                               | dev       | Format                                                                                                                                                                                                                                                          |

Le serveur de développement est `scripts/serve.js` (Node, zéro dépendance) plutôt qu'un paquet comme `serve` ou `http-server` : il reproduit le comportement de nginx (URL propres, 404 personnalisée, gzip) et lit les en-têtes de sécurité dans `docker/security-headers.conf`. La CSP est donc la même en développement, dans les tests et en production, et une violation fait échouer les tests e2e (erreur console). Il ajoute deux comportements de développement : la route `/_erreur-test` (500) et le lien vers la charte graphique dans le footer (marqueur `<!-- dev:styleguide -->`).

## Règles de lint propres au projet

- `html-validate` : `doctype-style` en minuscules et `void-style` en auto-fermant, pour s'accorder avec Prettier. `require-sri` limité aux ressources cross-origin : tout est servi depuis la même origine. `form-dup-name` autorise les cases à cocher de même nom : les facettes multi-valeurs du catalogue (`exposition`, `taille`) en dépendent.
- `stylelint` : `no-descending-specificity` désactivée. Avec l'imbrication et les couches de cascade, la règle signale des sélecteurs sans lien entre eux (lien du footer et lien du fil d'Ariane, état `:active` et `:disabled`) : l'ordre est géré par `@layer`.

## Pièges connus

- Le script inline du `<head>` est autorisé par son hash. Prettier le reformate : toujours lancer `yarn format` avant de recalculer. `make test-unit` affiche le hash attendu.
- Lighthouse CI lance Chrome avec `--no-sandbox` (user namespaces restreints sous Ubuntu). Ports : développement et Playwright 3130 (Playwright réutilise un `make up` en cours), Lighthouse 3250, contrôle de l'image de production 3140.
- `pkill -f "scripts/serve.js"` lancé dans un shell dont la commande contient cette chaîne tue aussi le shell. Préférer `kill $(pgrep -f "^node scripts/serve.js")`.
- Dans le panneau du menu de catégories, les colonnes imbriquées sont positionnées par rapport à leur colonne parente (`inset-inline-start: var(--column-width)` à chaque niveau), et la largeur du conteneur suit la profondeur ouverte par `:has()`. S'il déborde du viewport, `fitPanel()` le décale vers la gauche du strict nécessaire, au lieu de l'aligner sur le bord droit du bouton (qui le ferait sortir à gauche à 1024 px).
- La 500 de production (`50x.html`) n'est pas déclenchable simplement sous nginx : elle est testée en développement via `/_erreur-test`, et `make test-prod` vérifie que cette route répond 404 dans l'image.
