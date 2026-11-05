import sys
# splice.py <file> <new-section-file> <start-marker> <end-marker>
path, newp, start_marker, end_marker = sys.argv[1:5]
src = open(path).read()
start = src.index(start_marker)
end = src.index(end_marker)
src = src[:start] + open(newp).read() + '\n' + src[end:]
open(path, 'w').write(src)
print('spliced', path, start, end)
