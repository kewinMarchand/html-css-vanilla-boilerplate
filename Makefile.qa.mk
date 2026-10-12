qa: lint arch-selftest icons-check format-check test-unit ## QA rapide : HTML, CSS, architecture, auto-test des règles, sprite d'icônes, format, tests unitaires

qa-full: qa test-e2e test-a11y metrics test-prod ## QA complète : QA rapide + e2e + a11y + Lighthouse + image de prod

lint: ## html-validate, stylelint et règles d'architecture (dependency-cruiser)
	yarn lint

arch-selftest: ## Écrit des violations volontaires des règles d'architecture, exige leur détection, puis les retire
	node scripts/arch-selftest.js

icons-check: ## Échoue si site/icons.svg ou la liste des noms ne correspondent plus à icons.json
	node scripts/icons.js --check

lint-fix: ## stylelint avec correction automatique
	yarn lint:fix

format: ## Prettier (écriture)
	yarn format

format-check: ## Prettier (vérification)
	yarn format:check

test: test-unit test-e2e test-a11y ## Tous les tests

test-unit: ## Tests unitaires (node:test)
	yarn test:unit

test-e2e: ## Tests end-to-end desktop et mobile (Playwright)
	yarn test:e2e

test-a11y: ## Tests d'accessibilité WCAG 2.1 AA, deux modes (axe-core + Playwright)
	yarn test:a11y

metrics: ## Métriques Lighthouse CI (perf ≥ 90, a11y et SEO = 100)
	CHROME_PATH=$$(node -e 'import("@playwright/test").then(({ chromium }) => console.log(chromium.executablePath()))') yarn lhci

test-prod: ## Vérifie l'image Docker de production (codes HTTP, en-têtes, maintenance)
	sh scripts/test-prod.sh

.PHONY: qa qa-full lint arch-selftest icons-check lint-fix format format-check test test-unit test-e2e test-a11y metrics test-prod
