import { spawnSync } from 'node:child_process'
import { rmSync, writeFileSync } from 'node:fs'

const VIOLATIONS = [
  {
    rule: 'module-vers-autre-module',
    file: 'site/js/modules/task/ui/archSelftestViolation.js',
    source: "import '../../catalog/domain/catalogQuery.js'\n",
  },
  {
    rule: 'socle-vers-module-ou-vue',
    file: 'site/js/shared/archSelftestViolation.js',
    source: "import '../modules/catalog/domain/catalogQuery.js'\n",
  },
  {
    rule: 'domaine-hors-domaine',
    file: 'site/js/modules/catalog/domain/archSelftestViolation.js',
    source: "import '../infrastructure/catalogRepository.js'\n",
  },
  {
    rule: 'infrastructure-hors-domaine',
    file: 'site/js/modules/catalog/infrastructure/archSelftestViolation.js',
    source: "import '../ui/catalog.js'\n",
  },
  {
    rule: 'interface-vers-infrastructure',
    file: 'site/js/modules/catalog/ui/archSelftestViolation.js',
    source: "import '../infrastructure/catalogRepository.js'\n",
  },
  {
    rule: 'application-hors-domaine-infrastructure',
    file: 'site/js/modules/catalog/application/archSelftestViolation.js',
    source: "import '../ui/activeFilters.js'\n",
  },
  {
    rule: 'module-vers-vue',
    file: 'site/js/modules/contact/ui/archSelftestViolation.js',
    source: "import '/js/views/styleguide/contrast.js'\n",
  },
  {
    rule: 'vue-vers-module',
    file: 'site/js/views/styleguide/archSelftestViolation.js',
    source: "import '/js/modules/task/domain/tasks.js'\n",
  },
  {
    rule: 'embla-hors-carrousel',
    file: 'site/js/shared/archSelftestViolation.js',
    source: "import '/vendor/embla-carousel.esm.js'\n",
  },
  {
    rule: 'outillage-vers-interface',
    file: 'lib/archSelftestViolation.js',
    source: "import '../site/js/modules/catalog/ui/catalog.js'\n",
  },
  {
    rule: 'import-introuvable',
    file: 'site/js/shared/archSelftestViolation.js',
    source: "import './fichierAbsent.js'\n",
  },
]

let failures = 0
for (const violation of VIOLATIONS) {
  writeFileSync(violation.file, violation.source)
  try {
    const result = spawnSync(
      'node_modules/.bin/depcruise',
      ['--config', '.dependency-cruiser.cjs', '--output-type', 'err', violation.file],
      { encoding: 'utf8' },
    )
    const output = `${result.stdout}${result.stderr}`
    if (result.status === 0) {
      failures++
      console.error(`ÉCHEC  ${violation.rule} : la violation passe, la règle est débranchée.`)
    } else if (!output.includes(violation.rule)) {
      failures++
      console.error(`ÉCHEC  ${violation.rule} : échec pour une autre raison :\n${output}`)
    } else {
      console.info(`OK     ${violation.rule} : violation détectée.`)
    }
  } finally {
    rmSync(violation.file, { force: true })
  }
}

console.info(
  failures === 0
    ? `${VIOLATIONS.length} violations volontaires détectées, fichiers retirés.`
    : `${failures} règle(s) inopérante(s) sur ${VIOLATIONS.length}.`,
)
process.exitCode = failures === 0 ? 0 : 1
