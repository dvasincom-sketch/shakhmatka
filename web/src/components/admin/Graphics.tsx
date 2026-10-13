import * as LOGO from '../../lib/logo-paths'

/** Логотип «Огонёк» в админке Payload: экран входа (Logo) и боковое меню (Icon). Цвет букв — из темы админки. */
export function Icon() {
  return (
    <svg viewBox={LOGO.MARK_VIEWBOX} height={22} width={22 * LOGO.MARK_RATIO} aria-hidden="true" style={{ display: 'block' }}>
      <path d={LOGO.MARK_D} fill="var(--theme-text, #1B1B1D)" /><circle cx={LOGO.DOT.cx} cy={LOGO.DOT.cy} r={LOGO.DOT.r} fill="#FF8A3D" />
    </svg>
  )
}

export function Logo() {
  return (
    <svg viewBox={LOGO.WORD_VIEWBOX} height={44} width={44 * LOGO.WORD_RATIO} role="img" aria-label="Шахматка" style={{ display: 'block' }}>
      <path d={LOGO.WORD_D} fill="var(--theme-text, #1B1B1D)" /><circle cx={LOGO.DOT.cx} cy={LOGO.DOT.cy} r={LOGO.DOT.r} fill="#FF8A3D" />
    </svg>
  )
}
