import json,glob,re,collections
N={int(k):v for k,v in json.load(open('../N.json')).items()}
R={}
bad=0
for f in sorted(glob.glob('out/b*.jsonl')):
    for l in open(f):
        try: r=json.loads(l); R[r['id']]=r
        except Exception: bad+=1
print('записей',len(R),'битых',bad)
def norm(s):
    if not s: return None
    s=s.replace('ё','е').replace('Ё','Е').strip(' «»"\'.')
    s=re.sub(r'^(ЗУ|ул\.?|улица)\s+','',s,flags=re.I)
    s=re.sub(r'\s+',' ',s); s=re.sub(r'\s*,\s*',', ',s)
    s=re.sub(r'\b(стр|строение)\.?\s*',' стр. ',s); s=re.sub(r'\b(вл|влд|владение)\.?\s*',' вл. ',s)
    s=re.sub(r'\s+',' ',s).strip()
    return s.lower()
canon={}  # norm -> display
keyc=collections.Counter()
for r in R.values():
    for o in r.get('objects') or []:
        k=norm(o.get('key'))
        if k: keyc[(k,o['key'].strip())]+=1
for (k,disp),c in keyc.most_common():
    canon.setdefault(k,disp)
# имя -> адрес по совместной встречаемости
name2key=collections.defaultdict(collections.Counter)
for r in R.values():
    for o in r.get('objects') or []:
        k=norm(o.get('key'))
        for nm in [o.get('name')]+(o.get('aliases') or []):
            if k and nm and norm(nm)!=k: name2key[norm(nm)][k]+=1
# название без адреса → сколько раз встречается само по себе
namecnt=collections.Counter()
for r in R.values():
    for o in r.get('objects') or []:
        if o.get('name'): namecnt[norm(o['name'])]+=1
def name_to_key(n):
    c=name2key.get(n)
    if not c: return None
    k,v=c.most_common(1)[0]; tot=sum(c.values())
    # устойчивая связь: ≥2 совместных упоминаний, ≥70% всех связей названия и название не встречается чаще без этого адреса в 3+ раза
    if v>=2 and v/tot>=0.7 and namecnt[n] <= v*3: return k
    return None
def resolve(o):
    k=norm(o.get('key'))
    if k: return k
    for nm in [o.get('name')]+(o.get('aliases') or []):
        n=norm(nm)
        if n:
            kk=name_to_key(n)
            if kk: return kk
    n=norm(o.get('name'))
    return ('имя:'+n) if n else None
# основной объект заметки по ссылкам: если в заметке объект без ключа, берём ключ из главного объекта заметки, на которую ссылаемся
main_key={}
for nid,r in R.items():
    for o in r.get('objects') or []:
        if o.get('role')=='main':
            k=resolve(o)
            if k: main_key[nid]=k; break
O=collections.defaultdict(lambda: {'notes':set(),'events':[],'names':collections.Counter(),'aliases':collections.Counter(),'devs':collections.Counter(),'districts':collections.Counter(),'cities':collections.Counter(),'main':0})
unres=0
for nid,r in R.items():
    objs=r.get('objects') or []
    keys=[]
    for o in objs:
        k=resolve(o)
        if not k and o.get('role')=='main':
            for ref in (r.get('refs_earlier') or [])+([N[nid]['reply']] if N.get(nid,{}).get('reply') else []):
                if ref in main_key: k=main_key[ref]; break
        keys.append(k)
        if not k: unres+=1; continue
        d=O[k]; d['notes'].add(nid)
        if o.get('role')=='main': d['main']+=1
        if o.get('name'): d['names'][o['name'].strip(' «»"')]+=1
        for a in o.get('aliases') or []: d['aliases'][a.strip(' «»"')]+=1
        if o.get('developer'): d['devs'][o['developer']]+=1
        if o.get('district'): d['districts'][o['district']]+=1
        if o.get('city'): d['cities'][o['city']]+=1
    for e in r.get('events') or []:
        i=e.get('obj')
        if isinstance(i,int) and 0<=i<len(keys) and keys[i]:
            O[keys[i]]['events'].append({**e,'note':nid,'value':r.get('value')})
print('из них по названию',sum(1 for k in O if k.startswith('имя:')))
print('объектов (адресов)',len(O),'| объектов без адреса не привязано',unres)
cnt=lambda f: sum(1 for d in O.values() if f(d))
print('с ≥1 событием',cnt(lambda d:len(d['events'])>=1),'| ≥3',cnt(lambda d:len(d['events'])>=3),'| ≥5',cnt(lambda d:len(d['events'])>=5),'| ≥10',cnt(lambda d:len(d['events'])>=10))
print('главный объект хотя бы в 2 заметках',cnt(lambda d:d['main']>=2))
ev=[e for d in O.values() for e in d['events']]
print('событий привязано',len(ev),'| по типам',collections.Counter(e['type'] for e in ev).most_common())
print('| достоверность',collections.Counter(e.get('certainty') for e in ev).most_common())
print('value заметок',collections.Counter(r.get('value') for r in R.values()).most_common(),'| kind',collections.Counter(r.get('kind') for r in R.values()).most_common())
conf=[(nid,r['confirms']) for nid,r in R.items() if r.get('confirms')]
print('заметок-подтверждений',len(conf))
top=sorted(O.items(),key=lambda x:-len(x[1]['events']))[:30]
for k,d in top:
    ds=sorted(e['date'] for e in d['events'])
    print(f"  {len(d['events']):3d} соб. {len(d['notes']):3d} зам. {ds[0][:7]}…{ds[-1][:7]}  {canon.get(k,k)} | {d['names'].most_common(1)[0][0] if d['names'] else ''} | {d['devs'].most_common(1)[0][0] if d['devs'] else ''}")
# слияние «имя:X» с адресом, если X — главное название этого адреса
merged=0
for k in [k for k in list(O) if k.startswith('имя:')]:
    n=k[4:]; c=name2key.get(n)
    if not c: continue
    a,v=c.most_common(1)[0]
    if v<2 or v/sum(c.values())<0.6 or a not in O: continue
    tops=[norm(x) for x,_ in O[a]['names'].most_common(2)]
    if n not in tops: continue
    src=O.pop(k); dst=O[a]
    dst['notes']|=src['notes']; dst['events']+=src['events']; dst['main']+=src['main']
    for f in ('names','aliases','devs','districts','cities'): dst[f].update(src[f])
    merged+=1
print('слито «название → адрес»:',merged,'| объектов теперь',len(O))
# сохраняем
out={}
for k,d in O.items():
    out[k]={'key':(None if k.startswith('имя:') else canon.get(k,k)),'byname':k.startswith('имя:'),'notes':sorted(d['notes']),'events':sorted(d['events'],key=lambda e:(e.get('date') or '',e['note'])),'names':d['names'].most_common(),'aliases':d['aliases'].most_common(),'devs':d['devs'].most_common(),'districts':d['districts'].most_common(),'cities':d['cities'].most_common(),'main':d['main']}
json.dump(out,open('registry.json','w'),ensure_ascii=False)
json.dump({str(k):v for k,v in R.items()},open('notes_marked.json','w'),ensure_ascii=False)
