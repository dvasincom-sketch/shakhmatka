import sys
def h(s):
    x=0
    for ch in s: x=(x*31+ord(ch))%1000000007
    return x
p=sys.argv[1]; s=open(p,encoding='utf-8').read().rstrip('\n')
print(p, len(s.split('\n')), h(s))
