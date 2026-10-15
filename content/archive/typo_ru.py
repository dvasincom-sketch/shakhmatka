"""Типографика названий по «Справочнику издателя и автора» Мильчина и Чельцовой:
условные названия организаций кириллицей — в кавычках-ёлочках («Основа», ГК «Конти»);
латиница (MR Group), аббревиатуры (ПИК, ФСК, ДОМ.РФ, А101), описательные названия
(Фонд реновации, Департамент…) и имена людей — без кавычек."""
import re
GENERIC = re.compile(r'^(ГК|Группа|СЗ|ООО|АО|ПАО|УК|ДСК)\s+(.+)$')
NOQUOTE = re.compile(r'^(Фонд|Департамент|Московский|Правительство|структура|команда|Юрий|Сбер$|Ростех$|РЖД)', re.I)
def _needs(name):
    if not name or '«' in name or not re.search('[А-Яа-яЁё]', name): return False
    if NOQUOTE.search(name): return False
    core = re.sub(r'[\s.\-+\d]', '', name)
    if core.isupper() and len(core) <= 6: return False          # ПИК, ФСК, ДОМРФ, МИЦ, АЕОН, А101
    if re.fullmatch(r'[А-ЯЁA-Z]{2,6}(-[А-ЯЁA-Za-zа-яё]+)?', name): return False
    return True
def qn(name):
    """«Основа», ГК «Конти», MR Group, ПИК."""
    if not name: return name
    m = GENERIC.match(name)
    if m: return f'{m.group(1)} «{m.group(2)}»' if _needs(m.group(2)) else name
    return f'«{name}»' if _needs(name) else name
def _forms(name):
    if ' ' in name or '-' in name: return [re.escape(name)]
    st = re.escape(name[:-1]); last = name[-1]
    if last == 'а': return [st + '(?:а|ы|е|у|ой|ою)']
    if last == 'я': return [st + '(?:я|и|е|ю|ей)']
    if last == 'ь': return [st + '(?:ь|и|ью)']
    if last == 'й': return [st + '(?:й|я|ю|ем|е)']
    if re.match('[А-Яа-яЁё]', last): return [re.escape(name) + '(?:|а|у|ом|е)']
    return [re.escape(name)]
def quote_names(text, names):
    """Ставит ёлочки вокруг упоминаний названий (с падежными окончаниями), если их ещё нет."""
    if not text: return text
    for n in sorted({x for x in names if x}, key=len, reverse=True):
        if not _needs(n) or GENERIC.match(n): continue
        for f in _forms(n):
            text = re.sub(r'(?<![«„\w\-.])(' + f + r')(?![\w»“\-])', r'«\1»', text)
    return text

def tidy(text):
    """Вложенные кавычки — «лапки» внутри ёлочек; адреса (улица, номер дома) без кавычек."""
    if not text: return text
    text = re.sub(r'«([^«»]*)«([^«»]+)»»', r'«\1„\2“»', text)
    text = re.sub(r'«([^«»]*)«([^«»]+)»([^«»]*)»', r'«\1„\2“\3»', text)
    text = re.sub(r'«([А-ЯЁ][а-яё\-]+(?:ом|ой|ая|ий|ый|ое|ая)?(?: [А-ЯЁа-яё\-]+)?), (\d+[а-яА-Я]?(?:/\d+[а-яА-Я]?)?(?: ?(?:стр\.?|с|к\.?) ?\d+)?)»', r'\1, \2', text)
    text = re.sub(r'(?<=\S) - (?=\S)', ' — ', text)
    text = re.sub(r'(?<![.…])\.\.(?!\.)', '.', text)  # «ул..» в конце фразы
    return text
