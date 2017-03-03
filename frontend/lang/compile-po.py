#!/usr/bin/python3

import sys, json

if len(sys.argv)!=3:
    print(""" compile-po <input pofile> <output json>

    Compiles a .po file into a JSON file to be used by Serverboards
    """)
    sys.exit(1)

data = {}
last_orig=None
last_trans=None
fd = open(sys.argv[1])
nline=0
error=False
missing=0

def get_str(l):
    """ Returns the string that starts in the given line """
    s=""
    state=0 # 0 prequote, 1 inquote
    for c in l:
        #print(repr(l),c,state,s)
        if state==0:
            if c=='"':
                state=1
        elif state==1:
            if c=='"':
                return s
            else:
                s+=c
    if state==0:
        error=True
        print("Error at line %s, expecting quoted string"%(nline))
    # multiline. Not yet.
    print("Multiline string nos supported yet!")
    error=True
    return ""


try:
    while True:
        l = next(fd)
        nline+=1
        if l.startswith("msgid"):
            s=get_str(l)
            #print("Set msgid: %s"%s)
            last_orig=s
        if l.startswith("msgstr"):
            s=get_str(l)
            #print("Set trans: %s"%s)
            last_trans=s
            if last_orig and last_trans:
                data[last_orig]=last_trans
            elif last_orig or last_trans: # ignore full empty (shoud be only one (as coalesced), but not always)
                missing+=1
except StopIteration:
    pass


open(sys.argv[2],"w+").write( json.dumps(data) )
print("%d translations, %d missing translations"%(len(data), missing))
if error:
    print("There were errors when compiling the translation file")
    sys.exit(1)
sys.exit(0)
