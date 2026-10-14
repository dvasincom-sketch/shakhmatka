# Промт для новой сессии: следующая партия статей «Шахматки»

Скопируй текст ниже в новый чат (проект «недвижимость», компьютер подключён).

---

Продолжаем конвейер статей «Шахматки» из архива. Контекст — документы проекта (claude/контекст-проекта.md,
claude/застройщики-районы-словарь.md). Проект на моём Mac: /Users/dmitryvasin/shakhmatka; картинки архива:
/Users/dmitryvasin/tg_parser/output/propertyinsider/media (в сессии подключена как папка propertyinsider).

1. Подготовка. Через оболочку на Mac упакуй проект без тяжёлого (node_modules, .next, web/media, web/*.db,
   content/objects/photos, content/articles/media, _to_delete) и перенеси в облако; разверни в /home/claude.
   Нужны: content/, pipeline/ (вместе с pipeline/notes-text.json — тексты заметок), web/ (только код).
   Порядок работы — pipeline/README.md, бриф — pipeline/BRIEF.md (v3), промт — pipeline/editorial.md.
2. Перепроверка партии 6: 9 пакетов не проверены из-за лимита поиска (skip_reason: unchecked) —
   35780, 32287, 23346, 33255, 33348, 35329, 25167, 21812, 21891. Пакеты лежат в pipeline/batch-06/packs/,
   фото бери из папки propertyinsider. Перепиши их статьи заново по брифу (файлы content/articles/<id>-*.md перезаписать).
3. Партия 7: python3 content/archive/build-article-packs.py --batch 7 --size 36. Фото заметок партии — tar через оболочку
   на Mac → в облако → pipeline/batch-07/media/.
4. Авторы — субагенты sonnet, по 3 пакета на агента, волнами не больше 6 агентов одновременно (у сессии общий лимит
   веб-поиска ~200 запросов: это ~33 статьи на сессию). Первая волна — перепроверка, дальше партия 7.
   Если лимит кончился — остановись, остаток пометь unchecked и запиши номера в README.
5. После авторов: python3 content/archive/harvest-articles.py → python3 content/archive/build-dossiers.py; проверка,
   что в статьях нет t.me, max.ru и названия старого канала; строка итогов партии в pipeline/README.md.
6. Синхронизация на Mac: новые/изменённые content/articles/*.md и media, content/objects/corrections.json,
   archive-dossiers.json, web/src/lib/districts.ts, pipeline/README.md, pipeline/batch-07/plan.json.
   Перезаписывать на месте, ничего не удалять; мусор — в _to_delete/.
7. В конце скажи мне, какие команды запустить на Mac для импорта
   (npm run seed:dossiers && npm run seed && npm run seed:dossiers при остановленном dev-сервере).

Правила редакции те же: только проверенные факты; главное событие не подтвердилось — статьи нет (skip: unverifiable,
событие уходит в досье как «участники рынка говорили … — не подтвердилось»); без старого названия канала и рекламы;
две даты (заметки и проверки); SEO под Яндекс.
