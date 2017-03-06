#!/usr/bin/python3

import sys, json

if len(sys.argv)!=3:
    print(""" compile-po <input pofile> <output json>

    Compiles a .po file into a JSON file to be used by Serverboards
    """)
    sys.exit(1)

data = {}
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
                return s.replace("\\n", "\n")
            else:
                s+=c
    if state==0:
        error=True
        print("Error at line %s, expecting quoted string"%(nline))
    # multiline. Not yet.
    print("Multiline string nos supported yet!")
    error=True
    return ""


def parse_file(fd):
    global nline
    last_orig=None
    last_trans=None
    context=None

    state=0 # wait for msgid none, wait for msgtxt
    for l in fd:
        nline+=1
        if state==0:
            if l.startswith("msgid"): # as initial state is 0, get first msgid
                last_orig=get_str(l)
            elif l.startswith('"'):
                last_orig+=get_str(l)
            elif l.startswith("msgstr"):
                last_trans=get_str(l)
                state=1
            elif l.startswith("msgctxt"):
                context=get_str(l)
        elif state==1:
            if l.startswith('"'):
                last_trans+=get_str(l)
            elif l.startswith("msgctxt"):
                store_data(context, last_orig, last_trans)
                context=get_str(l)
                state=0
            elif l.startswith("msgid"):
                store_data(context, last_orig, last_trans)
                context=None
                last_orig=get_str(l)
                state=0
    store_data(context, last_orig, last_trans)

def store_data(context, orig, trans):
    global missing
    if orig and trans:
        if context:
            orig='%s|%s'%(context, orig)
        data[orig]=trans
    else:
        missing+=1

parse_file(open(sys.argv[1]))

open(sys.argv[2],"w+").write( json.dumps(data, indent=2) )
print("%d translations, %d missing translations"%(len(data), missing))
if error:
    print("There were errors when compiling the translation file")
    sys.exit(1)
sys.exit(0)
