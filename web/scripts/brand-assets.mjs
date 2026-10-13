/**
 * Фирменные файлы Шахматки, логотип «Огонёк»: npm run brand
 *
 * Логотип — слово «шахматка» шрифтом Unbounded 500 в кривых; над правой стойкой «ш» горит оранжевая точка,
 * как над «i» в этом шрифте (по центру стойки, на 20% крупнее родной точки «i» — чтобы держаться в 16 px).
 * Знак (иконки, favicon, аватары) — та же «ш» с точкой.
 *
 * Пишет:
 *   src/lib/logo-paths.ts — контуры для сайта и админки (одна геометрия на всё);
 *   public/ — favicon.svg/.ico, apple-touch-icon, icon-192/512, maskable, og-default.png, logo(-dark).svg;
 *   ../brand/ — логотипы, знак, favicon, иконка приложения, картинка для соцсетей.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import sharp from 'sharp'

const require = createRequire(import.meta.url)
const opentype = require('opentype.js')

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const PUB = path.join(ROOT, 'public')
const BRAND = path.resolve(ROOT, '..', 'brand')
const FONTS = path.join(ROOT, 'node_modules/@fontsource')
fs.mkdirSync(PUB, { recursive: true }); fs.mkdirSync(BRAND, { recursive: true })

const C = {
  light: { ink: '#1B1B1D', dot: '#FF8A3D', bg: '#FBFAF6', muted: '#6F6B64' },
  dark: { ink: '#F3F1EC', dot: '#FF9550', bg: '#111111' },
}

// ---------- геометрия (единицы шрифта, upm 1000, базовая линия y=0, вверх — минус) ----------
const U = opentype.loadSync(path.join(FONTS, 'unbounded/files/unbounded-cyrillic-500-normal.woff'))
const TRACK = -35 // −0,035 em, как в заголовках сайта
const DOT = { cx: 1002, cy: -730, r: 120 } // центр правой стойки «ш» (919…1086); у родной «i» r≈102, cy≈−720
const TOP = -(Math.abs(DOT.cy) + DOT.r) // верх точки = верх логотипа

let x = 0, WORD_D = ''
const glyphs = U.stringToGlyphs('шахматка')
glyphs.forEach((g, i) => {
  WORD_D += g.getPath(x, 0, 1000).toPathData(0)
  x += g.advanceWidth + (i < glyphs.length - 1 ? TRACK + U.getKerningValue(g, glyphs[i + 1]) : 0)
})
const WORD_W = Math.round(x)
const MARK_D = U.charToGlyph('ш').getPath(0, 0, 1000).toPathData(0)
const MARK_X0 = 63, MARK_W = 1023 // границы «ш» в шрифте

const WORD_VB = `0 ${TOP} ${WORD_W} ${-TOP}`
const MARK_VB = `${MARK_X0} ${TOP} ${MARK_W} ${-TOP}`

// ---------- контуры для сайта ----------
fs.writeFileSync(path.join(ROOT, 'src/lib/logo-paths.ts'), `// Сгенерировано scripts/brand-assets.mjs (npm run brand) — не править руками.
// Логотип «Огонёк»: «шахматка» Unbounded 500 в кривых + оранжевая точка над правой стойкой «ш».
export const WORD_VIEWBOX = '${WORD_VB}'
export const WORD_RATIO = ${(WORD_W / -TOP).toFixed(4)}
export const WORD_D = '${WORD_D}'
export const MARK_VIEWBOX = '${MARK_VB}'
export const MARK_RATIO = ${(MARK_W / -TOP).toFixed(4)}
export const MARK_D = '${MARK_D}'
export const DOT = { cx: ${DOT.cx}, cy: ${DOT.cy}, r: ${DOT.r} }
`)

// ---------- SVG ----------
const dot = (fill) => `<circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="${fill}"/>`
/** Логотип с полями pad (в единицах шрифта) */
const logoSvg = (c, pad = 0, bg) => {
  const w = WORD_W + pad * 2, h = -TOP + pad * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${TOP - pad} ${w} ${h}" width="${Math.round(w / 4)}" height="${Math.round(h / 4)}" role="img" aria-label="Шахматка">${bg ? `<rect x="${-pad}" y="${TOP - pad}" width="${w}" height="${h}" fill="${bg}"/>` : ''}<path d="${WORD_D}" fill="${c.ink}"/>${dot(c.dot)}</svg>`
}
const markSvg = (c, pad = 40) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_X0 - pad} ${TOP - pad} ${MARK_W + pad * 2} ${-TOP + pad * 2}" width="${Math.round((MARK_W + pad * 2) / 4)}" height="${Math.round((-TOP + pad * 2) / 4)}" role="img" aria-label="Шахматка"><path d="${MARK_D}" fill="${c.ink}"/>${dot(c.dot)}</svg>`

/** Квадратная иконка: знак по центру на фоне; k — доля ширины, которую занимает знак */
function appIcon(size, c, bg, k = 0.56, radius = 0) {
  const s = (size * k) / MARK_W
  const w = MARK_W * s, h = -TOP * s
  const tx = (size - w) / 2 - MARK_X0 * s, ty = (size - h) / 2 - TOP * s
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${bg}"/><g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})"><path d="${MARK_D}" fill="${c.ink}"/>${dot(c.dot)}</g></svg>`
}

// favicon.svg: сам переключается под тёмную тему браузера
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_X0 - 20} ${TOP - 20 - 90} ${MARK_W + 40} ${MARK_W + 40}"><style>.i{fill:${C.light.ink}}.d{fill:${C.light.dot}}@media (prefers-color-scheme:dark){.i{fill:${C.dark.ink}}.d{fill:${C.dark.dot}}}</style><path class="i" d="${MARK_D}"/><circle class="d" cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}"/></svg>`

/** Строка текста Onest в кривых: кириллица и латиница (пробелы, знаки) из двух наборов шрифта */
function textPath(str, size, tx, ty) {
  const fonts = ['onest-cyrillic-500-normal.woff', 'onest-latin-500-normal.woff'].map((f) => opentype.loadSync(path.join(FONTS, 'onest/files', f)))
  let x = tx, d = ''
  for (const ch of str) {
    const font = fonts.find((f) => f.charToGlyphIndex(ch) > 0) || fonts[1]
    const g = font.charToGlyph(ch)
    d += g.getPath(x, ty, size).toPathData(1)
    x += (g.advanceWidth / font.unitsPerEm) * size
  }
  return d
}

/** Картинка для соцсетей 1200×630: логотип, подпись и крупный «огонёк» в углу */
function ogImage() {
  const c = C.light
  const s = 0.112 // логотип ≈ 710 px шириной
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630"><rect width="1200" height="630" fill="${c.bg}"/>`
    + `<circle cx="1085" cy="128" r="150" fill="${c.dot}"/>`
    + `<g transform="translate(80 ${96 - TOP * s}) scale(${s})"><path d="${WORD_D}" fill="${c.ink}"/>${dot(c.dot)}</g>`
    + `<path d="${textPath('Новостройки без рекламы и слухов', 38, 82, 430)}" fill="${c.ink}"/>`
    + `<path d="${textPath('Цены, сроки и застройщики — по документам', 26, 82, 482)}" fill="${c.muted}"/></svg>`
}

async function png(svg, file, size) {
  await sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toFile(file)
}
async function ico(file) {
  const sizes = [16, 32, 48]
  const bufs = await Promise.all(sizes.map((s) => sharp(Buffer.from(appIcon(s * 8, C.dark, C.light.ink, 0.7, s * 8 * 0.22)), { density: 300 }).resize(s, s).png().toBuffer()))
  const head = Buffer.alloc(6 + 16 * sizes.length)
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4)
  let off = head.length
  sizes.forEach((s, i) => {
    const e = 6 + 16 * i
    head.writeUInt8(s, e); head.writeUInt8(s, e + 1); head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6)
    head.writeUInt32LE(bufs[i].length, e + 8); head.writeUInt32LE(off, e + 12); off += bufs[i].length
  })
  fs.writeFileSync(file, Buffer.concat([head, ...bufs]))
}

const files = {
  [path.join(BRAND, 'logo.svg')]: logoSvg(C.light),
  [path.join(BRAND, 'logo-dark.svg')]: logoSvg(C.dark, 180, C.dark.bg),
  [path.join(BRAND, 'logo-mark.svg')]: markSvg(C.light),
  [path.join(BRAND, 'logo-mark-dark.svg')]: markSvg(C.dark),
  [path.join(BRAND, 'favicon.svg')]: favicon,
  [path.join(BRAND, 'app-icon.svg')]: appIcon(1024, C.dark, C.light.ink),
  [path.join(PUB, 'favicon.svg')]: favicon,
  [path.join(PUB, 'logo.svg')]: logoSvg(C.light),
  [path.join(PUB, 'logo-dark.svg')]: logoSvg(C.dark),
}
for (const [f, s] of Object.entries(files)) fs.writeFileSync(f, s)

await png(appIcon(1024, C.dark, C.light.ink), path.join(PUB, 'apple-touch-icon.png'), 180)
await png(appIcon(1024, C.dark, C.light.ink, 0.56, 230), path.join(PUB, 'icon-192.png'), 192)
await png(appIcon(1024, C.dark, C.light.ink, 0.56, 230), path.join(PUB, 'icon-512.png'), 512)
await png(appIcon(1024, C.dark, C.light.ink, 0.44), path.join(PUB, 'icon-maskable-512.png'), 512)
await ico(path.join(PUB, 'favicon.ico'))
for (const dir of [PUB, BRAND]) await sharp(Buffer.from(ogImage()), { density: 144 }).resize(1200, 630).png().toFile(path.join(dir, 'og-default.png'))
console.log('Готово: логотип «Огонёк» — src/lib/logo-paths.ts, public/ и brand/ обновлены')
