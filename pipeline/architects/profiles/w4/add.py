import json,sys,os
out='/home/claude/pipeline/architects/profiles/out-4.json'
data=json.load(open(out)) if os.path.exists(out) else []
new=json.load(open(sys.argv[1]))
data=[d for d in data if d['key']!=new['key']]+[new]
json.dump(data,open(out,'w'),ensure_ascii=False,indent=1)
print(len(data))
