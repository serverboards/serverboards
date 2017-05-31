#!/usr/bin/python3

import os, json, sys
s10s_cli = __import__('s10s-cli')
printc=s10s_cli.printc

def maybe_list(l):
    if type(l) == list:
        return l
    return [l]

def main():
    cli=s10s_cli.CliClient(interactive=False)
    cli.authenticate()
    allok = True
    for s in cli.call("plugin.component.catalog", type="test"):
        printc("## %s / %s"%(s["name"], s["id"]), color="blue")
        command = s["extra"]["command"]
        if '/' not in command:
            command = s["plugin"]+"/"+command

        try:
            plugin = cli.call("plugin.start", command, _timeout=10)
        except Exception as e:
            printc("Cant start command! %s"%(command), color="red")
            allok = False
            continue
        for test in cli.call("plugin.call", plugin, "dir"):
            if test.startswith("test_"):
                try:
                    result = cli.call("plugin.call",plugin, test)
                except Exception as e:
                    result = e
                if result == True:
                    printc("* OK  %s"%(test), color="green")
                else:
                    printc("* NOK %s -> %s"%(test, result), color="red")
                    allok = False
        try:
            cli.call("plugin.stop", plugin)
        except:
            pass

    sys.exit( 0 if allok else 1 )


if __name__=='__main__':
    try:
        if argv[1]=="--one-line-help":
            print("Runs plugins tests")
            sys.exit(0)
    except:
        pass
    main()
