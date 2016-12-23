import re

TAG=re.compile('{{(.*?)}}')
def render(txt, data):
    if not txt:
        return ""
    def search_and_replace(tag):
        return find_tag(tag.group(1).split('.'), data)
    ret = TAG.sub(search_and_replace, txt)
    return ret

def find_tag(tagl, data):
    if len(tagl)==0:
        return str(data)
    i=tagl[0]
    if i.isdigit():
        i=int(i)
    try:
        v=data[i]
    except:
        # could not find i in data
        return ""
    return find_tag(tagl[1:], v)

def test():
    assert render("Hola mundo",{})=="Hola mundo"
    assert render("Hola mundo {a}",{"a":1})=="Hola mundo 1"
    assert render("Hola mundo {a.b}",{"a":{"b":2}})=="Hola mundo 2"
    assert render("Hola mundo {a.0.b} {b}",{"a":[{"b":3}], "b":"4"})=="Hola mundo 3 4"
    assert render("Hola mundo {a}",{})=="Hola mundo "

if __name__=='__main__':
    test()
