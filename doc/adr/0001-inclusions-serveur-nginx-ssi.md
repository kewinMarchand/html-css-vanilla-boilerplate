# 0001 — Header et footer partagés par inclusions côté serveur (SSI)

- **Statut** : Proposée
- **Date** : 2026-10-12
- **Décideurs** : Kewin Marchand

## Contexte

Le site est en HTML, CSS et JavaScript natifs, sans framework ni étape de build. Jusqu'ici, `site/` était servi tel quel, et chacune des 27 pages contenait sa propre copie du lien d'évitement, du header (logo, navigation, menu de catégories en trois niveaux, boutons Menu et mode renforcé) et du footer. Soit environ 270 lignes recopiées par page.

Un test unitaire vérifiait que ces copies restaient identiques à l'état `aria-current` près, mais toute modification du header imposait de toucher les 27 fichiers, et la dernière (header mobile compact) en a modifié 27 d'un coup. Le coût grandit avec chaque page et chaque évolution du layout.

Les contraintes restent les mêmes : aucune étape de build, aucune dépendance d'exécution ajoutée, le même HTML servi, et une CSP sans `unsafe-inline`. La production tourne déjà sur nginx, qui sait faire des inclusions côté serveur (module `ngx_http_ssi_module`, compilé dans l'image officielle).

## Décision

On sert le site par nginx avec les inclusions côté serveur, toujours sans build.

- Le lien d'évitement et le header vivent dans `site/partials/header.html`, le footer dans `site/partials/footer.html`.
- Chaque page commence son `<body>` par `<!--# set var="page" value="…" -->`, puis inclut les deux fichiers par `<!--# include virtual="/partials/….html" -->`.
- L'état propre à la page (`aria-current` du logo, des liens de navigation et des liens légaux) est choisi dans le partial par `<!--# if expr="$page = …" -->`. Les valeurs sont des mots sans barre oblique (`accueil`, `contact`), car nginx lit `/texte/` comme une expression régulière.
- La configuration de production active `ssi on;` et rend `/partials/` interne (404 en accès direct).
- `scripts/serve.js` résout le même sous-ensemble en développement et en test (`scripts/ssi.js` : include virtual, set, if, elif, else, endif, comparaisons `=` et `!=`), et lève une erreur sur toute autre directive.
- La validation HTML porte sur le rendu final : `scripts/render-pages.js` résout les inclusions dans `.cache/rendered/`, que html-validate valide. Les tests unitaires lisent eux aussi le rendu.

## Alternatives envisagées

- **Garder la recopie dans chaque page** : zéro outillage, mais 27 fichiers à modifier à chaque évolution du layout, et un test qui ne fait que constater la duplication.
- **Générateur statique (script de build ou outil comme Eleventy)** : réintroduit une étape de build et un écart entre le code source et le site servi, ce que le dépôt refuse par principe.
- **Inclusion côté client (fetch puis injection)** : le header arrive après le premier rendu, ce qui dégrade le CLS et le LCP, rend le header invisible sans JavaScript et aux robots, et demande d'injecter du HTML, que la CSP et les règles de sécurité du dépôt découragent.
- **Web Components avec templates** : même dépendance au JavaScript pour un contenu structurant, et un header absent du HTML servi.
- **Inclusions d'un autre serveur (Apache, Caddy `templates`)** : la production est déjà sur nginx, changer de serveur pour cette seule raison n'apporte rien.

## Conséquences

- **Positives** :
  - le header et le footer existent en un seul exemplaire ;
  - le HTML servi est identique à celui d'avant, aux commentaires SSI près, en développement comme en production (diff normalisé sur toutes les pages) ;
  - aucune dépendance ajoutée, la CSP est inchangée, et le site reste lisible et servable sans build.
- **Négatives / coûts** :
  - `site/` n'est plus servi tel quel : un serveur statique sans SSI (ouverture directe du fichier, hébergement purement statique) afficherait des pages sans header ni footer. L'hébergement doit savoir faire des SSI (nginx, Apache) ;
  - le serveur de développement maintient sa propre implémentation du sous-ensemble utilisé, qu'il faut faire évoluer si une nouvelle directive est employée (elle échoue explicitement sinon) ;
  - nginx retire les `Content-Length`, `Last-Modified` et `ETag` des pages traitées, donc plus de réponse 304 sur le HTML. Les feuilles de style, scripts et images ne sont pas concernés ;
  - les lignes des directives laissent des espaces en fin de ligne dans le HTML servi, d'où la règle html-validate `no-trailing-whitespace` coupée sur le rendu (les sources restent contrôlées par Prettier).
- **Suivi** : rouvrir la décision si l'hébergement doit devenir purement statique (CDN sans serveur), ou si le nombre de directives nécessaires grossit au point qu'un générateur deviendrait plus simple à maintenir.
