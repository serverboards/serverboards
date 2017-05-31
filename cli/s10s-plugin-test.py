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
    suites = cli.call("plugin.component.catalog", type="test")
    if len(sys.argv)>1:
        suites = [x for x in suites if x["id"] in sys.argv[1:]]

    for s in suites:
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
        tests = [
            x for x in
            sorted(cli.call("plugin.call", plugin, "dir"))
            if x.startswith("test_") or x.endswith("_test")
            ]
        tests_count = len(tests)
        for n, test in enumerate(tests):
            printc("* %s (%d/%d) ...\r"%(test, n+1, tests_count), end="", flush=True)
            try:
                result = cli.call("plugin.call",plugin, test)
            except Exception as e:
                result = e
            if result == True or result == None:
                printc("* %-48s OK"%(test), color="green")
            else:
                printc("* %-48s NOK -> %s"%(test, result), color="red")
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
