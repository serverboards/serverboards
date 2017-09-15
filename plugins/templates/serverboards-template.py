#!/usr/bin/python3

import os, sys, re

TAG_RE=re.compile(r'\[(.*?)\]')

def gather_tags(files):
    tags = set()
    for f in files:
        with open(f) as fd:
            for t in TAG_RE.findall(fd.read()):
                tags.add(t)
    ret = {}
    for t in sorted(tags):
        ret[t] = input(" %s> "%t)

    return ret

def install(fromd, tod):
    pathpre=len(fromd)+1
    files = [os.path.join(dp, f)[pathpre:] for dp, dn, fn in os.walk(fromd) for f in fn]

    print("Please answer how to fill these placeholders:")
    tags=gather_tags([os.path.join(fromd, x) for x in files])

    dirs=set()
    for f in files:
        orig = os.path.join(fromd, f)
        dest = os.path.join(tod, f)
        destd = os.path.dirname(dest)
        if not destd in dirs:
            os.makedirs(destd, exist_ok=True)
        with open(orig) as rfd:
            with open(dest,'w') as wfd:
                rawdata = rfd.read()
                data = TAG_RE.sub( lambda m: tags[m.group(1)], rawdata )
                wfd.write(data)
        origmode = os.stat(orig).st_mode
        os.chmod(dest, origmode)


    if 'template.postinst' in files:
        os.chdir(tod)
        ok = os.system('./template.postinst')
        if ok != 0:
            print("Error executing the template postinst")
        else:
            print("Postinst OK")
        os.unlink('./template.postinst')

if __name__=='__main__':
    if len(sys.argv)!=3:
        print("\nRun as:\n %s [templatename] [destdir]\n"%(__file__))
        sys.exit(1)
    install(os.path.join(os.path.dirname(__file__), sys.argv[1]),sys.argv[2])
    print("Ready at %s"%os.path.abspath(sys.argv[2]))
