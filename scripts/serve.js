import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const ROOT = fileURLToPath(new URL('../site/', import.meta.url))
const HEADERS_FILE = fileURLToPath(new URL('../docker/security-headers.conf', import.meta.url))
const PORT = Number(process.argv[2] ?? 3130)
const MAINTENANCE = process.env.MAINTENANCE === '1'
const ERROR_TEST_ROUTE = '/_erreur-test'
const STYLEGUIDE_MARKER = '<!-- dev:styleguide -->'
const STYLEGUIDE_LINK = '<p><a href="/charte-graphique">Charte graphique (développement)</a></p>'

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.xml': 'text/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

const SECURITY_HEADERS = Object.fromEntries(
  [
    ...(await readFile(HEADERS_FILE, 'utf8')).matchAll(
      /add_header\s+([\w-]+)\s+"([^"]*)"\s+always;/g,
    ),
  ].map(([, name, value]) => [name, value]),
)

const isFile = async (path) => {
  try {
    return (await stat(path)).isFile()
  } catch {
    return false
  }
}

const decodePath = (pathname) => {
  try {
    return decodeURIComponent(pathname)
  } catch {
    return undefined
  }
}

const resolveFile = async (pathname) => {
  const decoded = decodePath(pathname)
  if (decoded === undefined) return undefined
  const path = join(ROOT, normalize(decoded))
  if (!path.startsWith(ROOT)) return undefined
  for (const candidate of [path, join(path, 'index.html')]) {
    if (await isFile(candidate)) return candidate
  }
  return undefined
}

const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.webmanifest', '.svg', '.xml'])

const send = async (request, response, status, file, extraHeaders = {}) => {
  const extension = extname(file)
  const headers = {
    ...SECURITY_HEADERS,
    ...extraHeaders,
    'Content-Type': TYPES[extension] ?? 'application/octet-stream',
  }
  if (!COMPRESSIBLE.has(extension)) {
    response.writeHead(status, headers)
    if (request.method === 'HEAD') response.end()
    else createReadStream(file).pipe(response)
    return
  }

  let body = await readFile(file)
  if (extension === '.html') {
    body = Buffer.from(body.toString('utf8').replace(STYLEGUIDE_MARKER, STYLEGUIDE_LINK))
  }
  if (/\bgzip\b/.test(request.headers['accept-encoding'] ?? '')) {
    body = gzipSync(body)
    headers['Content-Encoding'] = 'gzip'
  }
  response.writeHead(status, { ...headers, Vary: 'Accept-Encoding' })
  response.end(request.method === 'HEAD' ? undefined : body)
}

createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    await send(request, response, 405, join(ROOT, '405.html'), { Allow: 'GET, HEAD' })
    return
  }
  const { pathname } = new URL(request.url, 'http://localhost')
  const file = await resolveFile(pathname)
  const isPage = !file || extname(file) === '.html'

  if (MAINTENANCE && isPage) {
    await send(request, response, 503, join(ROOT, '503.html'), { 'Retry-After': '3600' })
  } else if (pathname === ERROR_TEST_ROUTE) {
    await send(request, response, 500, join(ROOT, '50x.html'))
  } else if (file) {
    await send(request, response, 200, file)
  } else {
    await send(request, response, 404, join(ROOT, '404.html'))
  }
}).listen(PORT, () => {
  console.log(`Serveur statique prêt sur http://localhost:${PORT}`)
})
