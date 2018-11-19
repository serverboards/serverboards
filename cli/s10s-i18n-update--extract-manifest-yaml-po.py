#!/usr/bin/python3

import sys
import yaml

EXTRACT_TAGS = ["description", "name", "label"]
FULL_EXTRACT_TAGS = ["result"]
known_texts = set()


def cleanify(t):
    return t.replace("\n", "\\n").replace('"', '\\"')


def extract_text_in_context(k, context):
    if context == "params":
        return k != "name"
    if context == "fields":
        return k != "name"
    return True


def add_to_trans(v, filename):
    v = cleanify(v)
    if v not in known_texts:
        print("#: %s" % filename)
        print("msgid \"%s\"" % (v))
        print("msgstr \"\"")
        print("")
        known_texts.add(v)


def full_extract(d, filename):
    if isinstance(d, str):
        add_to_trans(d, filename)
    else:
        for v in d.values():
            full_extract(v, filename)


def extract_texts(d, context, filename):
    if isinstance(d, str):
        return

    for k, v in d.items():
        if k in EXTRACT_TAGS:
            if extract_text_in_context(k, context):
                add_to_trans(v, filename)
        if k in FULL_EXTRACT_TAGS:
            full_extract(v, filename)
        if type(v) == dict:
            extract_texts(v, k, filename)
        if type(v) == list:
            for i in v:
                extract_texts(i, k, filename)


for f in sys.argv[1:]:
    try:
        y = yaml.load(open(f))
        extract_texts(y, "root", f)
    except Exception:
        print("Error parsing %s" % (f), file=sys.stderr)
        import traceback
        traceback.print_exc()
        print("", file=sys.stderr)
