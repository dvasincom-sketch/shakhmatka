/**
 * Справка о районах: население, площадь, станции метро и МЦК. СГЕНЕРИРОВАНО pipeline/district-stats/build-district-stats.py — руками не править.
 * Население — Росстат (районы: на 1.01.2025; бывшие поселения ТиНАО: на 1.01.2024). Станции — по координатам станций и границам районов OpenStreetMap, октябрь 2026.
 * МЦД пока не размечены.
 */
export type Station = { name: string; system: 'metro' | 'mck' | 'mcd'; lines: string[] }
export type DistrictStats = { population?: number; populationYear?: string; populationSource?: string; areaKm2?: number; areaSource?: string; note?: string; stations?: Station[]; stationsSource?: string }
export const LINE_NAMES: Record<string, string> = {"1": "Сокольническая", "2": "Замоскворецкая", "3": "Арбатско-Покровская", "4": "Филёвская", "5": "Кольцевая", "6": "Калужско-Рижская", "7": "Таганско-Краснопресненская", "8": "Калининская", "8А": "Солнцевская", "9": "Серпуховско-Тимирязевская", "10": "Люблинско-Дмитровская", "11": "Большая кольцевая", "12": "Бутовская", "14": "МЦК", "15": "Некрасовская", "16": "Троицкая", "17": "Рублёво-Архангельская"}
export const DISTRICT_STATS: Record<string, DistrictStats> = {
"akademicheskiy": {
"population": 114932,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.83,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Академическая",
"system": "metro",
"lines": [
"6",
"16"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"alekseevskiy": {
"population": 79377,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.29,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Алексеевская",
"system": "metro",
"lines": [
"6"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"altufevskiy": {
"population": 56008,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 3.25,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"arbat": {
"population": 36942,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 2.11,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Библиотека имени Ленина",
"system": "metro",
"lines": [
"1"
]
},
{
"name": "Смоленская",
"system": "metro",
"lines": [
"3",
"4"
]
},
{
"name": "Арбатская",
"system": "metro",
"lines": [
"3",
"4"
]
},
{
"name": "Александровский сад",
"system": "metro",
"lines": [
"4"
]
},
{
"name": "Боровицкая",
"system": "metro",
"lines": [
"9"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"aeroport": {
"population": 82804,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 4.58,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Сокол",
"system": "metro",
"lines": [
"2"
]
},
{
"name": "Аэропорт",
"system": "metro",
"lines": [
"2"
]
},
{
"name": "Динамо",
"system": "metro",
"lines": [
"2"
]
},
{
"name": "Петровский парк",
"system": "metro",
"lines": [
"11"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"babushkinskiy": {
"population": 90087,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.07,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Бабушкинская",
"system": "metro",
"lines": [
"6"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"basmannyy": {
"population": 112320,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 8.37,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Курская",
"system": "metro",
"lines": [
"3",
"5"
]
},
{
"name": "Бауманская",
"system": "metro",
"lines": [
"3"
]
},
{
"name": "Чкаловская",
"system": "metro",
"lines": [
"10"
]
},
{
"name": "Электрозаводская",
"system": "metro",
"lines": [
"11"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"begovoy": {
"population": 43662,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.56,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"beskudnikovskiy": {
"population": 81647,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 3.3,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Селигерская",
"system": "metro",
"lines": [
"10"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"bibirevo": {
"population": 159377,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 6.45,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Алтуфьево",
"system": "metro",
"lines": [
"9"
]
},
{
"name": "Бибирево",
"system": "metro",
"lines": [
"9"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"biryulevo-vostochnoe": {
"population": 155760,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 14.77,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"biryulevo-zapadnoe": {
"population": 84910,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 8.51,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"bogorodskoe": {
"population": 108907,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 10.24,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Бульвар Рокоссовского",
"system": "metro",
"lines": [
"1"
]
},
{
"name": "Бульвар Рокоссовского",
"system": "mck",
"lines": [
"14"
]
},
{
"name": "Белокаменная",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"brateevo": {
"population": 100282,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 7.63,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Алма-Атинская",
"system": "metro",
"lines": [
"2"
]
},
{
"name": "Борисово",
"system": "metro",
"lines": [
"10"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"butyrskiy": {
"population": 72177,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.04,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Дмитровская",
"system": "metro",
"lines": [
"9"
]
},
{
"name": "Савёловская",
"system": "metro",
"lines": [
"9",
"11"
]
},
{
"name": "Фонвизинская",
"system": "metro",
"lines": [
"10"
]
},
{
"name": "Бутырская",
"system": "metro",
"lines": [
"10"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"veshnyaki": {
"population": 121088,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 10.72,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"voykovskiy": {
"population": 72588,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 6.61,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Войковская",
"system": "metro",
"lines": [
"2"
]
},
{
"name": "Балтийская",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"vostochnoe-degunino": {
"population": 101126,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 3.77,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Яхромская",
"system": "metro",
"lines": [
"10"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"vostochnoe-izmaylovo": {
"population": 74200,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 3.85,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"vostochnyy": {
"population": 12611,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 3.2,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"vykhino-zhulebino": {
"population": 242376,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 14.97,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Выхино",
"system": "metro",
"lines": [
"7"
]
},
{
"name": "Лермонтовский проспект",
"system": "metro",
"lines": [
"7"
]
},
{
"name": "Жулебино",
"system": "metro",
"lines": [
"7"
]
},
{
"name": "Юго-Восточная",
"system": "metro",
"lines": [
"15"
]
},
{
"name": "Косино",
"system": "metro",
"lines": [
"15"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"gagarinskiy": {
"population": 80221,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.5,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Ленинский проспект",
"system": "metro",
"lines": [
"6"
]
},
{
"name": "Вавиловская",
"system": "metro",
"lines": [
"16"
]
},
{
"name": "Площадь Гагарина",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"golovinskiy": {
"population": 109389,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 8.93,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Водный стадион",
"system": "metro",
"lines": [
"2"
]
},
{
"name": "Лихоборы",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"golyanovo": {
"population": 164305,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 14.99,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"danilovskiy": {
"population": 104718,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 12.6,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Автозаводская",
"system": "metro",
"lines": [
"2"
]
},
{
"name": "Автозаводская",
"system": "mck",
"lines": [
"14"
]
},
{
"name": "Технопарк",
"system": "metro",
"lines": [
"2"
]
},
{
"name": "Тульская",
"system": "metro",
"lines": [
"9"
]
},
{
"name": "ЗИЛ",
"system": "metro",
"lines": [
"16"
]
},
{
"name": "ЗИЛ",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"dmitrovskiy": {
"population": 104847,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 7.29,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Лианозово",
"system": "metro",
"lines": [
"10"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"donskoy": {
"population": 51202,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.73,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Крымская",
"system": "metro",
"lines": [
"16"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"dorogomilovo": {
"population": 76571,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 7.95,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Парк Победы",
"system": "metro",
"lines": [
"3",
"8А"
]
},
{
"name": "Киевская",
"system": "metro",
"lines": [
"3",
"4",
"5"
]
},
{
"name": "Кутузовская",
"system": "metro",
"lines": [
"4"
]
},
{
"name": "Кутузовская",
"system": "mck",
"lines": [
"14"
]
},
{
"name": "Студенческая",
"system": "metro",
"lines": [
"4"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"zamoskvorechye": {
"population": 56230,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 4.32,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Новокузнецкая",
"system": "metro",
"lines": [
"2"
]
},
{
"name": "Павелецкая",
"system": "metro",
"lines": [
"2",
"5"
]
},
{
"name": "Добрынинская",
"system": "metro",
"lines": [
"5"
]
},
{
"name": "Третьяковская",
"system": "metro",
"lines": [
"6",
"8"
]
},
{
"name": "Серпуховская",
"system": "metro",
"lines": [
"9"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"zapadnoe-degunino": {
"population": 85488,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 7.53,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Верхние Лихоборы",
"system": "metro",
"lines": [
"10"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"zyuzino": {
"population": 124371,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.45,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Нахимовский проспект",
"system": "metro",
"lines": [
"9"
]
},
{
"name": "Севастопольская",
"system": "metro",
"lines": [
"9"
]
},
{
"name": "Зюзино",
"system": "metro",
"lines": [
"11"
]
},
{
"name": "Каховская",
"system": "metro",
"lines": [
"11"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"zyablikovo": {
"population": 133650,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 4.38,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Красногвардейская",
"system": "metro",
"lines": [
"2"
]
},
{
"name": "Шипиловская",
"system": "metro",
"lines": [
"10"
]
},
{
"name": "Зябликово",
"system": "metro",
"lines": [
"10"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"ivanovskoe": {
"population": 125211,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 10.19,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"izmaylovo": {
"population": 110331,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 15.24,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Партизанская",
"system": "metro",
"lines": [
"3"
]
},
{
"name": "Измайловская",
"system": "metro",
"lines": [
"3"
]
},
{
"name": "Первомайская",
"system": "metro",
"lines": [
"3"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"kapotnya": {
"population": 32128,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 8.06,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"konkovo": {
"population": 154105,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 7.18,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Беляево",
"system": "metro",
"lines": [
"6"
]
},
{
"name": "Университет дружбы народов",
"system": "metro",
"lines": [
"16"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"koptevo": {
"population": 104775,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.38,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Коптево",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"kosino-ukhtomskiy": {
"population": 90207,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 15.05,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Улица Дмитриевского",
"system": "metro",
"lines": [
"15"
]
},
{
"name": "Лухмановская",
"system": "metro",
"lines": [
"15"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"kotlovka": {
"population": 66304,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 3.94,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"krasnoselskiy": {
"population": 46340,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 4.96,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Красносельская",
"system": "metro",
"lines": [
"1"
]
},
{
"name": "Комсомольская",
"system": "metro",
"lines": [
"1",
"5"
]
},
{
"name": "Красные Ворота",
"system": "metro",
"lines": [
"1"
]
},
{
"name": "Чистые пруды",
"system": "metro",
"lines": [
"1"
]
},
{
"name": "Тургеневская",
"system": "metro",
"lines": [
"6"
]
},
{
"name": "Сретенский бульвар",
"system": "metro",
"lines": [
"10"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"krylatskoe": {
"population": 83465,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 12.04,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Крылатское",
"system": "metro",
"lines": [
"3"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"kryukovo": {
"population": 115081,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 10.49,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"kuzminki": {
"population": 140738,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 8.15,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Кузьминки",
"system": "metro",
"lines": [
"7"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"kuntsevo": {
"population": 152171,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 16.56,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Молодёжная",
"system": "metro",
"lines": [
"3"
]
},
{
"name": "Кунцевская",
"system": "metro",
"lines": [
"3",
"4",
"11"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"kurkino": {
"population": 33676,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 7.9,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"levoberezhnyy": {
"population": 56573,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 8.0,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Беломорская",
"system": "metro",
"lines": [
"2"
]
},
{
"name": "Речной вокзал",
"system": "metro",
"lines": [
"2"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"lefortovo": {
"population": 113163,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 9.06,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Авиамоторная",
"system": "metro",
"lines": [
"8",
"11"
]
},
{
"name": "Лефортово",
"system": "metro",
"lines": [
"11"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"lianozovo": {
"population": 83759,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.79,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"lomonosovskiy": {
"population": 86867,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 3.34,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"losinoostrovskiy": {
"population": 83779,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.54,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"lyublino": {
"population": 185286,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 17.41,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Люблино",
"system": "metro",
"lines": [
"10"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"marfino": {
"population": 37549,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 2.26,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Владыкино",
"system": "metro",
"lines": [
"9"
]
},
{
"name": "Владыкино",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"marina-roshcha": {
"population": 62551,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 4.68,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Марьина Роща",
"system": "metro",
"lines": [
"10",
"11"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"marino": {
"population": 273463,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 11.91,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Братиславская",
"system": "metro",
"lines": [
"10"
]
},
{
"name": "Марьино",
"system": "metro",
"lines": [
"10"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"matushkino": {
"population": 40220,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 4.38,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"metrogorodok": {
"population": 40798,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 27.57,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"meshchanskiy": {
"population": 55669,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 4.6,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Проспект Мира",
"system": "metro",
"lines": [
"5",
"6"
]
},
{
"name": "Рижская",
"system": "metro",
"lines": [
"6",
"11"
]
},
{
"name": "Сухаревская",
"system": "metro",
"lines": [
"6"
]
},
{
"name": "Кузнецкий Мост",
"system": "metro",
"lines": [
"7"
]
},
{
"name": "Достоевская",
"system": "metro",
"lines": [
"10"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"mitino": {
"population": 198911,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 12.67,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Пятницкое шоссе",
"system": "metro",
"lines": [
"3"
]
},
{
"name": "Митино",
"system": "metro",
"lines": [
"3"
]
},
{
"name": "Волоколамская",
"system": "metro",
"lines": [
"3"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"mozhayskiy": {
"population": 146666,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 10.73,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Давыдково",
"system": "metro",
"lines": [
"11"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"molzhaninovskiy": {
"population": 14907,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 21.78,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"moskvoreche-saburovo": {
"population": 87843,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 9.3,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Каширская",
"system": "metro",
"lines": [
"2",
"11"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"nagatino-sadovniki": {
"population": 83794,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 8.17,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Коломенская",
"system": "metro",
"lines": [
"2"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"nagatinskiy-zaton": {
"population": 121411,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 9.8,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Кленовый бульвар",
"system": "metro",
"lines": [
"11"
]
},
{
"name": "Нагатинский Затон",
"system": "metro",
"lines": [
"11"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"nagornyy": {
"population": 76015,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.42,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Нагатинская",
"system": "metro",
"lines": [
"9"
]
},
{
"name": "Нагорная",
"system": "metro",
"lines": [
"9"
]
},
{
"name": "Варшавская",
"system": "metro",
"lines": [
"11"
]
},
{
"name": "Верхние Котлы",
"system": "mck",
"lines": [
"14"
]
},
{
"name": "Крымская",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"nekrasovka": {
"population": 115849,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 11.47,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Некрасовка",
"system": "metro",
"lines": [
"15"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"nizhegorodskiy": {
"population": 52114,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 7.57,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Нижегородская",
"system": "metro",
"lines": [
"11",
"15"
]
},
{
"name": "Нижегородская",
"system": "mck",
"lines": [
"14"
]
},
{
"name": "Новохохловская",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"novogireevo": {
"population": 99906,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 4.45,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Перово",
"system": "metro",
"lines": [
"8"
]
},
{
"name": "Новогиреево",
"system": "metro",
"lines": [
"8"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"novokosino": {
"population": 108479,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 3.6,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Новокосино",
"system": "metro",
"lines": [
"8"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"novo-peredelkino": {
"population": 121741,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 8.48,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Боровское шоссе",
"system": "metro",
"lines": [
"8А"
]
},
{
"name": "Новопеределкино",
"system": "metro",
"lines": [
"8А"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"obruchevskiy": {
"population": 91308,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 6.11,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Новые Черёмушки",
"system": "metro",
"lines": [
"6"
]
},
{
"name": "Калужская",
"system": "metro",
"lines": [
"6"
]
},
{
"name": "Новаторская",
"system": "metro",
"lines": [
"11",
"16"
]
},
{
"name": "Воронцовская",
"system": "metro",
"lines": [
"11"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"orekhovo-borisovo-severnoe": {
"population": 124071,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 7.67,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Орехово",
"system": "metro",
"lines": [
"2"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"orekhovo-borisovo-yuzhnoe": {
"population": 146515,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 6.94,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Домодедовская",
"system": "metro",
"lines": [
"2"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"ostankinskiy": {
"population": 65211,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 12.46,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "ВДНХ",
"system": "metro",
"lines": [
"6"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"otradnoe": {
"population": 188431,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 10.18,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Отрадное",
"system": "metro",
"lines": [
"9"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"ochakovo-matveevskoe": {
"population": 127231,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 17.54,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Озёрная",
"system": "metro",
"lines": [
"8А"
]
},
{
"name": "Аминьевская",
"system": "metro",
"lines": [
"11"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"perovo": {
"population": 133481,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 9.73,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Шоссе Энтузиастов",
"system": "metro",
"lines": [
"8"
]
},
{
"name": "Андроновка",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"pechatniki": {
"population": 90529,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 17.89,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Печатники",
"system": "metro",
"lines": [
"10",
"11"
]
},
{
"name": "Текстильщики",
"system": "metro",
"lines": [
"11"
]
},
{
"name": "Угрешская",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"pokrovskoe-streshnevo": {
"population": 68688,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 12.9,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Тушинская",
"system": "metro",
"lines": [
"7"
]
},
{
"name": "Спартак",
"system": "metro",
"lines": [
"7"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"preobrazhenskoe": {
"population": 89475,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.61,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Черкизовская",
"system": "metro",
"lines": [
"1"
]
},
{
"name": "Преображенская площадь",
"system": "metro",
"lines": [
"1"
]
},
{
"name": "Локомотив",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"presnenskiy": {
"population": 129041,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 11.7,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Москва-Сити",
"system": "metro",
"lines": [
"4"
]
},
{
"name": "Москва-Сити",
"system": "mck",
"lines": [
"14"
]
},
{
"name": "Деловой центр",
"system": "metro",
"lines": [
"4",
"8А",
"17"
]
},
{
"name": "Краснопресненская",
"system": "metro",
"lines": [
"5"
]
},
{
"name": "Улица 1905 года",
"system": "metro",
"lines": [
"7"
]
},
{
"name": "Баррикадная",
"system": "metro",
"lines": [
"7"
]
},
{
"name": "Шелепиха",
"system": "metro",
"lines": [
"17"
]
},
{
"name": "Шелепиха",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"prospekt-vernadskogo": {
"population": 65913,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 4.65,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Проспект Вернадского",
"system": "metro",
"lines": [
"1",
"11"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"ramenki": {
"population": 154283,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 18.54,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Университет",
"system": "metro",
"lines": [
"1"
]
},
{
"name": "Ломоносовский проспект",
"system": "metro",
"lines": [
"8А"
]
},
{
"name": "Раменки",
"system": "metro",
"lines": [
"8А"
]
},
{
"name": "Мичуринский проспект",
"system": "metro",
"lines": [
"8А",
"11"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"rostokino": {
"population": 52503,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 3.54,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Ботанический сад",
"system": "metro",
"lines": [
"6"
]
},
{
"name": "Ростокино",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"ryazanskiy": {
"population": 109884,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 6.49,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Рязанский проспект",
"system": "metro",
"lines": [
"7"
]
},
{
"name": "Стахановская",
"system": "metro",
"lines": [
"15"
]
},
{
"name": "Окская",
"system": "metro",
"lines": [
"15"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"savelki": {
"population": 37862,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 8.13,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"savelovskiy": {
"population": 61147,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 2.7,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"sviblovo": {
"population": 60437,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 4.41,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Свиблово",
"system": "metro",
"lines": [
"6"
]
},
{
"name": "Ботанический сад",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"severnoe-butovo": {
"population": 97376,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 9.13,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Бульвар Дмитрия Донского",
"system": "metro",
"lines": [
"9"
]
},
{
"name": "Улица Старокачаловская",
"system": "metro",
"lines": [
"12"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"severnoe-izmaylovo": {
"population": 85448,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 4.2,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Щёлковская",
"system": "metro",
"lines": [
"3"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"severnoe-medvedkovo": {
"population": 130718,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.66,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Медведково",
"system": "metro",
"lines": [
"6"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"severnoe-tushino": {
"population": 172664,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 9.4,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Планерная",
"system": "metro",
"lines": [
"7"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"severnyy": {
"population": 56537,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 10.29,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Физтех",
"system": "metro",
"lines": [
"10"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"silino": {
"population": 41971,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 10.4,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"sokol": {
"population": 58217,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 3.72,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"sokolinaya-gora": {
"population": 93960,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 7.84,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Электрозаводская",
"system": "metro",
"lines": [
"3"
]
},
{
"name": "Семёновская",
"system": "metro",
"lines": [
"3"
]
},
{
"name": "Измайлово",
"system": "mck",
"lines": [
"14"
]
},
{
"name": "Соколиная Гора",
"system": "mck",
"lines": [
"14"
]
},
{
"name": "Шоссе Энтузиастов",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"sokolniki": {
"population": 60852,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 10.28,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Сокольники",
"system": "metro",
"lines": [
"1",
"11"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"solntsevo": {
"population": 137612,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 11.29,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Румянцево",
"system": "metro",
"lines": [
"1"
]
},
{
"name": "Говорово",
"system": "metro",
"lines": [
"8А"
]
},
{
"name": "Солнцево",
"system": "metro",
"lines": [
"8А"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"staroe-kryukovo": {
"population": 41028,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 3.81,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"strogino": {
"population": 162885,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 16.84,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Строгино",
"system": "metro",
"lines": [
"3"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"taganskiy": {
"population": 134535,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 8.01,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Таганская",
"system": "metro",
"lines": [
"5",
"7"
]
},
{
"name": "Пролетарская",
"system": "metro",
"lines": [
"7"
]
},
{
"name": "Марксистская",
"system": "metro",
"lines": [
"8"
]
},
{
"name": "Площадь Ильича",
"system": "metro",
"lines": [
"8"
]
},
{
"name": "Римская",
"system": "metro",
"lines": [
"10"
]
},
{
"name": "Крестьянская Застава",
"system": "metro",
"lines": [
"10"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"tverskoy": {
"population": 76889,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 7.27,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Лубянка",
"system": "metro",
"lines": [
"1"
]
},
{
"name": "Охотный Ряд",
"system": "metro",
"lines": [
"1"
]
},
{
"name": "Белорусская",
"system": "metro",
"lines": [
"2",
"5"
]
},
{
"name": "Маяковская",
"system": "metro",
"lines": [
"2"
]
},
{
"name": "Тверская",
"system": "metro",
"lines": [
"2"
]
},
{
"name": "Театральная",
"system": "metro",
"lines": [
"2"
]
},
{
"name": "Площадь Революции",
"system": "metro",
"lines": [
"3"
]
},
{
"name": "Новослободская",
"system": "metro",
"lines": [
"5"
]
},
{
"name": "Китай-город",
"system": "metro",
"lines": [
"6",
"7"
]
},
{
"name": "Пушкинская",
"system": "metro",
"lines": [
"7"
]
},
{
"name": "Менделеевская",
"system": "metro",
"lines": [
"9"
]
},
{
"name": "Цветной бульвар",
"system": "metro",
"lines": [
"9"
]
},
{
"name": "Чеховская",
"system": "metro",
"lines": [
"9"
]
},
{
"name": "Трубная",
"system": "metro",
"lines": [
"10"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"tekstilshchiki": {
"population": 102030,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.92,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Текстильщики",
"system": "metro",
"lines": [
"7"
]
},
{
"name": "Волжская",
"system": "metro",
"lines": [
"10"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"teplyy-stan": {
"population": 133400,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 7.5,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Коньково",
"system": "metro",
"lines": [
"6"
]
},
{
"name": "Генерала Тюленева",
"system": "metro",
"lines": [
"16"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"timiryazevskiy": {
"population": 84168,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 10.43,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Петровско-Разумовская",
"system": "metro",
"lines": [
"9",
"10"
]
},
{
"name": "Тимирязевская",
"system": "metro",
"lines": [
"9"
]
},
{
"name": "Окружная",
"system": "metro",
"lines": [
"10"
]
},
{
"name": "Окружная",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"troparevo-nikulino": {
"population": 129268,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 11.27,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Юго-Западная",
"system": "metro",
"lines": [
"1"
]
},
{
"name": "Тропарёво",
"system": "metro",
"lines": [
"1"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"filevskiy-park": {
"population": 112403,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 9.62,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Багратионовская",
"system": "metro",
"lines": [
"4"
]
},
{
"name": "Фили",
"system": "metro",
"lines": [
"4"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"fili-davydkovo": {
"population": 112759,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 6.96,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Славянский бульвар",
"system": "metro",
"lines": [
"3"
]
},
{
"name": "Пионерская",
"system": "metro",
"lines": [
"4"
]
},
{
"name": "Филёвский парк",
"system": "metro",
"lines": [
"4"
]
},
{
"name": "Минская",
"system": "metro",
"lines": [
"8А"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"khamovniki": {
"population": 108015,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 10.08,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Кропоткинская",
"system": "metro",
"lines": [
"1"
]
},
{
"name": "Парк культуры",
"system": "metro",
"lines": [
"1",
"5"
]
},
{
"name": "Фрунзенская",
"system": "metro",
"lines": [
"1"
]
},
{
"name": "Спортивная",
"system": "metro",
"lines": [
"1"
]
},
{
"name": "Воробьёвы горы",
"system": "metro",
"lines": [
"1"
]
},
{
"name": "Лужники",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"khovrino": {
"population": 102047,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.73,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Ховрино",
"system": "metro",
"lines": [
"2"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"khoroshevo-mnevniki": {
"population": 183677,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 17.18,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Народное ополчение",
"system": "metro",
"lines": [
"11",
"17"
]
},
{
"name": "Мнёвники",
"system": "metro",
"lines": [
"11"
]
},
{
"name": "Терехово",
"system": "metro",
"lines": [
"11"
]
},
{
"name": "Звенигородская",
"system": "metro",
"lines": [
"17"
]
},
{
"name": "Бульвар Генерала Карбышева",
"system": "metro",
"lines": [
"17"
]
},
{
"name": "Хорошёво",
"system": "mck",
"lines": [
"14"
]
},
{
"name": "Зорге",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"khoroshevskiy": {
"population": 76407,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 9.88,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Полежаевская",
"system": "metro",
"lines": [
"7"
]
},
{
"name": "Беговая",
"system": "metro",
"lines": [
"7"
]
},
{
"name": "ЦСКА",
"system": "metro",
"lines": [
"11"
]
},
{
"name": "Хорошёвская",
"system": "metro",
"lines": [
"11"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"tsaritsyno": {
"population": 117967,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 8.43,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Кантемировская",
"system": "metro",
"lines": [
"2"
]
},
{
"name": "Царицыно",
"system": "metro",
"lines": [
"2"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"cheremushki": {
"population": 108619,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.52,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Профсоюзная",
"system": "metro",
"lines": [
"6"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"chertanovo-severnoe": {
"population": 109627,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 5.4,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Чертановская",
"system": "metro",
"lines": [
"9"
]
},
{
"name": "Южная",
"system": "metro",
"lines": [
"9"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"chertanovo-tsentralnoe": {
"population": 111581,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 6.52,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Пражская",
"system": "metro",
"lines": [
"9"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"chertanovo-yuzhnoe": {
"population": 156178,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 9.38,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Улица Академика Янгеля",
"system": "metro",
"lines": [
"9"
]
},
{
"name": "Аннино",
"system": "metro",
"lines": [
"9"
]
},
{
"name": "Лесопарковая",
"system": "metro",
"lines": [
"12"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"shchukino": {
"population": 112002,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 7.69,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Щукинская",
"system": "metro",
"lines": [
"7"
]
},
{
"name": "Октябрьское Поле",
"system": "metro",
"lines": [
"7"
]
},
{
"name": "Панфиловская",
"system": "mck",
"lines": [
"14"
]
},
{
"name": "Стрешнево",
"system": "mck",
"lines": [
"14"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"yuzhnoe-butovo": {
"population": 182030,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 25.54,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Улица Скобелевская",
"system": "metro",
"lines": [
"12"
]
},
{
"name": "Бульвар Адмирала Ушакова",
"system": "metro",
"lines": [
"12"
]
},
{
"name": "Улица Горчакова",
"system": "metro",
"lines": [
"12"
]
},
{
"name": "Бунинская аллея",
"system": "metro",
"lines": [
"12"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"yuzhnoe-medvedkovo": {
"population": 88821,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 3.88,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"yuzhnoe-tushino": {
"population": 113999,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 7.94,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Сходненская",
"system": "metro",
"lines": [
"7"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"yuzhnoportovyy": {
"population": 73321,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 4.53,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Волгоградский проспект",
"system": "metro",
"lines": [
"7"
]
},
{
"name": "Дубровка",
"system": "metro",
"lines": [
"10"
]
},
{
"name": "Дубровка",
"system": "mck",
"lines": [
"14"
]
},
{
"name": "Кожуховская",
"system": "metro",
"lines": [
"10"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"yakimanka": {
"population": 27416,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 4.8,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Октябрьская",
"system": "metro",
"lines": [
"5",
"6"
]
},
{
"name": "Шаболовская",
"system": "metro",
"lines": [
"6"
]
},
{
"name": "Полянка",
"system": "metro",
"lines": [
"9"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"yaroslavskiy": {
"population": 99398,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 7.99,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы"
},
"yasenevo": {
"population": 176629,
"populationYear": "на 1 января 2025 года, Росстат",
"populationSource": "https://rosstat.gov.ru/storage/mediabank/%D0%A1hisl_MO_01-01-2025.xlsx",
"areaKm2": 25.37,
"areaSource": "https://ru.wikipedia.org/wiki/Районы_Москвы",
"stations": [
{
"name": "Тёплый Стан",
"system": "metro",
"lines": [
"6"
]
},
{
"name": "Ясенево",
"system": "metro",
"lines": [
"6"
]
},
{
"name": "Новоясеневская",
"system": "metro",
"lines": [
"6"
]
},
{
"name": "Битцевский парк",
"system": "metro",
"lines": [
"12"
]
}
],
"stationsSource": "https://ru.wikipedia.org/wiki/Список_станций_Московского_метрополитена"
},
"vnukovskoe": {
"population": 64390,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 25.6,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в район Внуково."
},
"voronovskoe": {
"population": 14565,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 206.26,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в район Вороново."
},
"voskresenskoe": {
"population": 19919,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 24.77,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в районы Коммунарка, Щербинка."
},
"desenovskoe": {
"population": 47195,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 52.96,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в районы Коммунарка, Троицк."
},
"kievskiy": {
"population": 12040,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 56.5,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в район Бекасово."
},
"klenovskoe": {
"population": 5747,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 116.0,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в районы Вороново, Краснопахорский."
},
"kokoshkino": {
"population": 21756,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 9.0,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в район Внуково."
},
"krasnopakhorskoe": {
"population": 13029,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 87.78,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в районы Вороново, Краснопахорский."
},
"marushkinskoe": {
"population": 16230,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 50.63,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в районы Краснопахорский, Внуково, Филимонковский."
},
"mikhaylovo-yartsevskoe": {
"population": 9107,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 63.77,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в районы Вороново, Краснопахорский."
},
"moskovskiy": {
"population": 114244,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 40.38,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в районы Коммунарка, Филимонковский."
},
"mosrentgen": {
"population": 21590,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 6.41,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в район Коммунарка."
},
"novofedorovskoe": {
"population": 23187,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 156.75,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в районы Бекасово, Вороново."
},
"pervomayskoe": {
"population": 27069,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 118.94,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в районы Краснопахорский, Филимонковский."
},
"rogovskoe": {
"population": 6688,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 175.95,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в район Вороново."
},
"ryazanovskoe": {
"population": 33033,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 41.41,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в район Щербинка."
},
"sosenskoe": {
"population": 122303,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 66.81,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в район Коммунарка."
},
"troitsk": {
"population": 71615,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 16.33,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "С 8 мая 2024 года — центр района Троицк, в который вошли и соседние поселения."
},
"filimonkovskoe": {
"population": 17811,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 35.77,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в районы Коммунарка, Филимонковский."
},
"shchapovskoe": {
"population": 13360,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 86.06,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "Поселение упразднено 8 мая 2024 года и вошло в районы Вороново, Краснопахорский."
},
"shcherbinka": {
"population": 56531,
"populationYear": "на 1 января 2024 года, Росстат",
"populationSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"areaKm2": 7.62,
"areaSource": "https://ru.wikipedia.org/wiki/Поселения_Москвы",
"note": "С 8 мая 2024 года — центр района Щербинка, в который вошли и соседние поселения."
}
}
