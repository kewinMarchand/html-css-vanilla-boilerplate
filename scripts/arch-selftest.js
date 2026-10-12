import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/**
 * Écrit des modules, une vue et un fichier de socle factices, puis une violation volontaire
 * de chaque règle, et exige que dependency-cruiser la signale. Les fixtures ne dépendent
 * d'aucun module d'exemple : retirer catalog ou task ne casse pas l'auto-test.
 */
const MODULE_A = 'site/js/modules/arch-selftest-a'
const MODULE_B = 'site/js/modules/arch-selftest-b'
const VIEW = 'site/js/views/arch-selftest'

const FIXTURES = [
  `${MODULE_A}/domain/fixture.js`,
  `${MODULE_A}/application/fixture.js`,
  `${MODULE_A}/infrastructure/fixture.js`,
  `${MODULE_A}/ui/fixture.js`,
  `${MODULE_B}/domain/fixture.js`,
  `${VIEW}/fixture.js`,
]

const VIOLATIONS = [
  {
    rule: 'module-vers-autre-module',
    file: `${MODULE_A}/ui/violation.js`,
    source: "import '../../arch-selftest-b/domain/fixture.js'\n",
  },
  {
    rule: 'socle-vers-module-ou-vue',
    file: 'site/js/shared/archSelftestViolation.js',
    source: "import '../modules/arch-selftest-a/domain/fixture.js'\n",
  },
  {
    rule: 'domaine-hors-domaine',
    file: `${MODULE_A}/domain/violation.js`,
    source: "import '../infrastructure/fixture.js'\n",
  },
  {
    rule: 'infrastructure-hors-domaine',
    file: `${MODULE_A}/infrastructure/violation.js`,
    source: "import '../ui/fixture.js'\n",
  },
  {
    rule: 'interface-vers-infrastructure',
    file: `${MODULE_A}/ui/violation.js`,
    source: "import '../infrastructure/fixture.js'\n",
  },
  {
    rule: 'application-hors-domaine-infrastructure',
    file: `${MODULE_A}/application/violation.js`,
    source: "import '../ui/fixture.js'\n",
  },
  {
    rule: 'module-vers-vue',
    file: `${MODULE_A}/ui/violation.js`,
    source: "import '/js/views/arch-selftest/fixture.js'\n",
  },
  {
    rule: 'vue-vers-module',
    file: `${VIEW}/violation.js`,
    source: "import '/js/modules/arch-selftest-a/domain/fixture.js'\n",
  },
  {
    rule: 'embla-hors-carrousel',
    file: 'site/js/shared/archSelftestViolation.js',
    source: "import '/vendor/embla-carousel.esm.js'\n",
  },
  {
    rule: 'outillage-vers-interface',
    file: 'lib/archSelftestViolation.js',
    source: "import '../site/js/modules/arch-selftest-a/ui/fixture.js'\n",
  },
  {
    rule: 'import-introuvable',
    file: 'site/js/shared/archSelftestViolation.js',
    source: "import './fichierAbsent.js'\n",
  },
]

let failures = 0
try {
  for (const fixture of FIXTURES) {
    mkdirSync(dirname(fixture), { recursive: true })
    writeFileSync(fixture, 'export const fixture = true\n')
  }
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
} finally {
  for (const directory of [MODULE_A, MODULE_B, VIEW]) {
    rmSync(directory, { recursive: true, force: true })
  }
}

console.info(
  failures === 0
    ? `${VIOLATIONS.length} violations volontaires détectées, fichiers retirés.`
    : `${failures} règle(s) inopérante(s) sur ${VIOLATIONS.length}.`,
)
process.exitCode = failures === 0 ? 0 : 1
