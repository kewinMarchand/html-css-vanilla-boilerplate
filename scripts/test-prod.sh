#!/bin/sh
set -eu

IMAGE=html-css-vanilla-boilerplate:test
PORT=3140
NAME=html-css-vanilla-prod-test
FAILED=0

docker build --quiet --tag "$IMAGE" . > /dev/null

PAGES='/ /catalogue /catalogue/plantes-interieur /catalogue/plantes-interieur/feuillages /taches /contact /mentions-legales /donnees-personnelles /accessibilite /plan-du-site /route-inexistante'

start() {
  maintenance=$1
  shift
  docker rm --force "$NAME" > /dev/null 2>&1 || true
  docker run --detach --name "$NAME" --publish "$PORT:80" --env "MAINTENANCE=$maintenance" "$@" "$IMAGE" > /dev/null
  until curl --silent --output /dev/null "http://localhost:$PORT/"; do sleep 0.2; done
}

expect_status() {
  status=$(curl --silent --output /dev/null --write-out '%{http_code}' "http://localhost:$PORT$1")
  if [ "$status" = "$2" ]; then
    echo "ok   $2 $1"
  else
    echo "FAIL $1 : attendu $2, reçu $status"
    FAILED=1
  fi
}

expect_body() {
  body=$(curl --silent "http://localhost:$PORT$1")
  if printf '%s' "$body" | grep --quiet -- "$2" && ! printf '%s' "$body" | grep --quiet 'an error occurred'; then
    echo "ok   inclusions résolues sur $1"
  else
    echo "FAIL inclusions non résolues sur $1"
    FAILED=1
  fi
}

expect_no_ssi_error() {
  errors=0
  for route in $PAGES; do
    if curl --silent "http://localhost:$PORT$route" | grep --quiet 'an error occurred'; then
      echo "FAIL directive SSI en erreur sur $route"
      errors=1
      FAILED=1
    fi
  done
  if [ "$errors" = 0 ]; then echo "ok   aucune directive SSI en erreur ($1)"; fi
}

expect_header() {
  if curl --silent --head "http://localhost:$PORT$1" | grep --quiet --ignore-case "^$2"; then
    echo "ok   en-tête $2 sur $1"
  else
    echo "FAIL en-tête $2 absent sur $1"
    FAILED=1
  fi
}

start 0
for route in / /catalogue /catalogue/plantes-interieur /catalogue/plantes-interieur/feuillages \
  /taches /contact /mentions-legales /donnees-personnelles /accessibilite /plan-du-site \
  /sitemap.xml /robots.txt /vendor/embla-carousel.esm.js; do
  expect_status "$route" 200
done
expect_status /route-inexistante 404
expect_status /catalogue/categorie-inconnue 404
expect_status /charte-graphique 404
expect_status /_erreur-test 404
expect_status /404.html 404
expect_status /partials/header.html 404
expect_body / 'data-site-header'
expect_body /contact '<a href="/contact" aria-current="page">Contact</a>'
expect_body /route-inexistante 'class="site-footer"'
post_status=$(curl --silent --output /tmp/html-css-vanilla-405.html --write-out '%{http_code}' --data 'name=Ada' "http://localhost:$PORT/contact")
if [ "$post_status" = 405 ] && grep --quiet 'Envoi impossible sans JavaScript' /tmp/html-css-vanilla-405.html; then
  echo "ok   405 POST /contact, page française"
else
  echo "FAIL POST /contact : reçu $post_status sans la page française"
  FAILED=1
fi
expect_header / "content-security-policy: default-src 'self'; script-src 'self' 'sha256-"
expect_header /route-inexistante "x-content-type-options: nosniff"
expect_no_ssi_error "sans traceur"
if curl --silent "http://localhost:$PORT/" | grep --quiet 'data-glitchtip-dsn\|data-matomo-url'; then
  echo "FAIL un traceur est injecté sans configuration"
  FAILED=1
else
  echo "ok   aucun traceur sans configuration"
fi

start 0 --env 'GLITCHTIP_DSN=https://cle@glitchtip.example.com/1' \
  --env 'MATOMO_URL=https://matomo.example.com/' --env 'MATOMO_SITE_ID=1'
expect_no_ssi_error "avec traceurs"
expect_body / 'data-glitchtip-dsn="https://cle@glitchtip.example.com/1"'
expect_body / 'data-matomo-url="https://matomo.example.com/"'
expect_body /donnees-personnelles 'data-testid="legal-audience-measurement"'
if curl --silent "http://localhost:$PORT/route-inexistante" | grep --quiet 'data-glitchtip-dsn'; then
  echo "FAIL GlitchTip injecté sur une 404"
  FAILED=1
else
  echo "ok   GlitchTip absent d'une 404"
fi
expect_header / "content-security-policy: .*connect-src 'self' https://glitchtip.example.com https://matomo.example.com"

start 1
expect_status / 503
expect_body / 'data-site-header'
expect_status /catalogue 503
expect_status /css/main.css 200
expect_header / "retry-after: 3600"
expect_header / "content-security-policy"

docker rm --force "$NAME" > /dev/null
exit "$FAILED"
