import { defineConfig, globalIgnores } from 'eslint/config'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

export default defineConfig([
  globalIgnores([
    'site/vendor/',
    'vendor/',
    '.cache/',
    '.api/',
    'test-results/',
    'playwright-report/',
  ]),
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          // Ordre de standards-front, chemins servis du navigateur : 1 tiers (Node et paquets compris, copies de
          // /vendor/), 2 bibliothèque commune, 3 socle, 4 modules dans l'ordre des couches domain, application,
          // infrastructure, ui (un module importe ses propres couches en relatif), 5 vues, 6 autres relatifs,
          // 7 effets de bord en dernier, leur ordre pouvant compter.
          groups: [
            ['^node:', '^@?\\w', '^/vendor/(?!boilerplates-ui/)'],
            ['^/vendor/boilerplates-ui/'],
            ['^/js/shared/'],
            ['domain', 'application', 'infrastructure', 'ui'].flatMap((layer) => [
              `^/js/modules/[^/]+/${layer}/`,
              `^(\\.\\.?/)+${layer}/`,
            ]),
            ['^/js/views/'],
            ['^\\.'],
            ['^\\u0000'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
])
