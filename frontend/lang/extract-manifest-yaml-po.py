#!/usr/bin/python3

import sys, yaml

EXTRACT_TAGS=["description", "name"]

def cleanify(t):
    return t.replace("\n", "\\n")

known_texts=set()

def extract_texts(d, context, filename):
    for k,v in d.items():
        if k in EXTRACT_TAGS:
            v=cleanify(v)
            if not v in known_texts:
                print("#: %s"%filename)
                print("msgid \"%s\""%(v))
                print("msgstr \"\"")
                print("")
                known_texts.add(v)

for f in sys.argv[1:]:
    try:
        y = yaml.load(open(f))
        extract_texts(y, "root", f)
    except:
        print("Error parsing %s"%(f), file=sys.stderr)
        import traceback
        traceback.print_exc()
        print("", file=sys.stderr)
