import json,sys,os
out='/home/claude/pipeline/architects/profiles/out-3.json'
rec=json.load(open(sys.argv[1]))
data=json.load(open(out)) if os.path.exists(out) else []
data=[d for d in data if d['key']!=rec['key']]+[rec]
json.dump(data,open(out,'w'),ensure_ascii=False,indent=1)
print(len(data),'records')
