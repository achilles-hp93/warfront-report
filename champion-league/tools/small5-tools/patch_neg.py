"""Put the second animation back into a built bundle (the negative proof for item 3).

    python patch_neg.py <file> neg|restore

`neg` saves <file>.small5bak and re-inserts the MoveHost.presentMove calls the fix
removed from core/movement/reposition.js (every copy of the engine in the file);
`negfb` re-inserts only the granted FALL BACK's; `restore` puts the saved file back.
"""
import os
import shutil
import sys

path, mode = sys.argv[1], sys.argv[2]
bak = path + '.small5bak'
if mode == 'restore':
    shutil.move(bak, path)
    print('restored', path)
    sys.exit(0)

s = open(path, encoding='utf-8').read()
plain_old = ("  // The arrival chain has shown the move (MoveHost.afterCommit), as it shows every\n"
             "  // move moveUnit makes. Shown again here, the browser animated it twice.\n")
plain_new = "  MoveHost.presentMove(unit, route.path);\n"
fb_old = "    // fallBack's move has shown itself (moveUnit's arrival chain, MoveHost.afterCommit).\n"
fb_new = "    MoveHost.presentMove(unit, route.path);\n"
n1, n2 = s.count(plain_old), s.count(fb_old)
if n1 == 0 or n1 != n2:
    sys.exit('unexpected counts %d %d' % (n1, n2))
shutil.copyfile(path, bak)
if mode != 'negfb':
    s = s.replace(plain_old, plain_new)
s = s.replace(fb_old, fb_new)
open(path, 'w', encoding='utf-8').write(s)
print('patched %d copies in %s' % (n1, path))
