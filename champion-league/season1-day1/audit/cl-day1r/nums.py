import sys
L=open(sys.argv[1]).read().split('\n')
def after(label, n):
    for i,l in enumerate(L):
        if l==label: return L[i+1:i+1+n]
print('VP', after('Victory Points',3))
print('Units destroyed', after('Enemy units destroyed',3))
print('Damage', after('Damage dealt',3))
print('RP', after('Enemy RP destroyed',3))
print('Reinf', after('Reinforcements',3))
# VP by source table
for i,l in enumerate(L):
    if l=='Total' and L[i-1]=='Secondary missions':
        print('Sources', L[i+1:i+11]); break
for i,l in enumerate(L):
    if l.startswith('gained ') and 'CP and spent' in l: print(L[i-1], l, L[i+1], L[i+2])
