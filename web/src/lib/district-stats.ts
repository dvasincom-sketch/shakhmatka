/**
 * Справка о районах: население, площадь, станции метро/МЦК/МЦД.
 * Заполняется из проверенных открытых источников (pipeline/district-stats); пустой район — блок «Население и транспорт» не показывается.
 */
export type Station = { name: string; system: 'metro' | 'mck' | 'mcd'; lines: string[] }
export type DistrictStats = { population?: number; populationYear?: string; populationSource?: string; areaKm2?: number; areaSource?: string; stations?: Station[]; stationsSource?: string }
export const DISTRICT_STATS: Record<string, DistrictStats> = {}
