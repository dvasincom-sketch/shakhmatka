# Шахматка — сайт (Payload CMS 3 + Next.js 16)

Мобильный сайт шахматка.москва и редакционная админка в одном проекте. Данные — в SQLite (файл `shakhmatka.db`), для продакшена заменить на Postgres (`@payloadcms/db-postgres`).

## Запуск на своём компьютере

Нужен Node.js 20.9+ (проверить: `node -v`).

```bash
cd ~/shakhmatka/web
cp .env.example .env          # затем впишите в PAYLOAD_SECRET длинную случайную строку
npm install                   # 2–3 минуты
npm run seed                  # импорт статей из ../content/articles (повторный запуск обновляет, не дублирует)
npm run dev                   # сайт: http://localhost:3000, админка: http://localhost:3000/admin
```

При первом входе в `/admin` Payload попросит создать первого пользователя-редактора.

## Что где

| Путь | Что это |
| --- | --- |
| `src/collections/Articles.ts` | Статьи: текст (markdown), связи, SEO, FAQ, JSON-LD, протокол фактчекинга, черновики и версии |
| `src/collections/Objects.ts` | Объекты: адрес ЗУ, другие названия, стадия, застройщик |
| `src/collections/Developers.ts` | Застройщики |
| `src/collections/Media.ts` | Фото: alt (обязателен), подпись, правообладатель |
| `src/seed/import-articles.ts` | Импорт статей конвейера из `content/articles` |
| `src/app/(frontend)/` | Сайт: лента `/`, статья `/novosti/<slug>/`, объект `/obekty/<slug>/`, застройщик `/zastroyshchiki/<slug>/` |
| `src/app/(frontend)/styles.css` | Фирменный стиль v3 |
| `src/lib/markdown.ts` | Превращение markdown статьи в вёрстку сайта |

## SEO, что уже есть
- title, description, canonical, Open Graph из полей статьи; адреса со слешем на конце;
- JSON-LD (NewsArticle + FAQPage) в каждой статье;
- статьи со статусом «Нужна сверка» закрыты от индексации (`noindex`) и помечены плашкой;
- шрифты хранятся на сайте (без Google Fonts) — быстрее загрузка.

## Что дальше
- sitemap.xml и robots.txt, страницы словаря, районов и тем (ссылки на них уже есть в статьях);
- хостинг: Vercel / Яндекс Облако + Postgres + S3 для фото;
- поле текста перевести с markdown на визуальный редактор Lexical, когда редакция начнёт править вручную.
