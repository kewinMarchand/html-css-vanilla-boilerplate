import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIRECTIVE = /<!--#\s*(\w+)((?:\s+\w+="[^"]*")*)\s*-->/g
const PARAMETER = /(\w+)="([^"]*)"/g
const EXPRESSION = /^\$(\w+)\s*(!?=)\s*(.*)$/

export class SsiError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SsiError'
  }
}

const parameters = (raw) =>
  Object.fromEntries([...raw.matchAll(PARAMETER)].map(([, name, value]) => [name, value]))

const evaluate = (expression, variables) => {
  const match = expression?.match(EXPRESSION)
  if (!match) throw new SsiError(`Expression SSI non prise en charge : ${expression}`)
  const [, name, operator, text] = match
  const equal = (variables[name] ?? '') === text
  return operator === '=' ? equal : !equal
}

/**
 * Sous-ensemble des inclusions côté serveur de nginx utilisé par le site : include virtual,
 * set, if, elif, else, endif, et les expressions `$variable = texte` ou `$variable != texte`.
 * Comme dans nginx, une variable posée par `set` est visible dans les fichiers inclus.
 */
export const renderSsi = (html, { readInclude, variables = {} }) => {
  const conditions = []
  const isActive = () => conditions.every((condition) => condition.active)
  let output = ''
  let cursor = 0

  for (const match of html.matchAll(DIRECTIVE)) {
    if (isActive()) output += html.slice(cursor, match.index)
    cursor = match.index + match[0].length
    const [, command, raw] = match
    const params = parameters(raw)
    const current = conditions.at(-1)

    if (command === 'if') {
      const parentActive = isActive()
      const active = parentActive && evaluate(params.expr, variables)
      conditions.push({ parentActive, active, taken: active })
    } else if (command === 'elif' || command === 'else') {
      if (!current) throw new SsiError(`« ${command} » sans « if »`)
      current.active =
        current.parentActive &&
        !current.taken &&
        (command === 'else' || evaluate(params.expr, variables))
      current.taken ||= current.active
    } else if (command === 'endif') {
      if (!conditions.pop()) throw new SsiError('« endif » sans « if »')
    } else if (command === 'set') {
      if (isActive()) variables[params.var] = params.value
    } else if (command === 'include') {
      if (isActive()) output += renderSsi(readInclude(params.virtual), { readInclude, variables })
    } else {
      throw new SsiError(`Directive SSI non prise en charge : ${command}`)
    }
  }

  if (conditions.length > 0) throw new SsiError('« if » sans « endif »')
  return output + html.slice(cursor)
}

export const sitePages = (directory) =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name)
    if (statSync(path).isDirectory()) {
      return ['vendor', 'partials'].includes(name) ? [] : sitePages(path)
    }
    return name.endsWith('.html') ? [path] : []
  })
