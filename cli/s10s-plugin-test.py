#!/usr/bin/python3

import os, json, sys
s10s_cli = __import__('s10s-cli')
printc=s10s_cli.printc

def maybe_list(l):
    if type(l) == list:
        return l
    return [l]

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Connect to Serverboards CORE or a command line plugin.')
    parser.add_argument('suites', metavar='SUITES', type=str, nargs='*',
        help='suite names to run')
    parser.add_argument('--one-line-help', action='store_true',
        help='Shows brief description.')
    parser.add_argument('--auth-token', type=str,
        help="Auth Token to use for signing in.")

    args = parser.parse_args()

    if args.one_line_help:
        print("Executes tests on the installed plugins. USE WITH CARE.")
        return

    cli=s10s_cli.CliClient(interactive=False)
    cli.authenticate(auth_token = args.auth_token)

    allok = True
    suites = cli.call("plugin.component.catalog", type="test")
    if args.suites:
        suites = [x for x in suites if x["id"] in args.suites]
    printc("# Serverboards Plugin tests", color="blue")
    printc("*%d Suites to do*"%len(suites), color="blue")

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
    main()
