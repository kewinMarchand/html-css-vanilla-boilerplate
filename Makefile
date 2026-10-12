.DEFAULT_GOAL := help
include Makefile.qa.mk

PORT ?= 8080

help: ## Affiche cette aide
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Installe les dépendances, copie Embla dans site/vendor et installe Chromium
	yarn install --frozen-lockfile
	npx playwright install chromium

up: ## Lance le serveur statique de développement (http://localhost:3130)
	yarn dev

icons: ## Génère site/icons.svg et la liste des noms depuis icons.json (noms Lucide)
	node scripts/icons.js

docker-build: ## Construit l'image nginx de production
	docker compose build

docker-up: ## Lance l'image de production (port PORT, 8080 par défaut)
	docker compose up

docker-down: ## Arrête le conteneur
	docker compose down

.PHONY: help install up icons docker-build docker-up docker-down
