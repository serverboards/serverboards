#!/usr/bin/python3

import os, json, sys
s10s_cli = __import__('s10s-cli')
printc=s10s_cli.printc

LEVEL_COLOR={
  "warn": "yellow",
  "error": "red",
  "info": "white",
  "debug": "blue"
}

def maybe_list(l):
    if type(l) == list:
        return l
    return [l]

def fix_identation(str, ident):
  return str.replace('\n', "\n"+" "*ident)

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Connect to Serverboards CORE or a command line plugin.')
    parser.add_argument('suites', metavar='SUITES', type=str, nargs='*',
        help='Suite names to run')
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
            cli.call("@log.info", "Start plugin test %s:%s"%(command,test), {"file": "s10s plugin-test", "line":"--"})
            logl=cli.call("logs.list", count=1)["lines"]
            start_log_id = logl[-1]["id"]-1 # Show the "Start plugin test message"

            printc("* %s (%d/%d)...\r"%(test, n+1, tests_count), end="", flush=True)
            try:
                result = cli.call("plugin.call",plugin, test)
            except KeyboardInterrupt:
              result = "keyboard_interrupted"
            except Exception as e:
                result = e
            if result == True or result == None:
                cli.call("@log.info", "Finish plugin test %s:%s OK"%(command,test), {"file": "s10s plugin-test", "line":"--"})
                printc("* %-48s OK"%(test), color="green")
            else:
                cli.call("@log.error", "Finish plugin test %s:%s NOK"%(command,test), {"file": "s10s plugin-test", "line":"--"})
                printc("* %-48s NOK -> %s"%(test, result), color="red")
                for l in reversed( cli.call("logs.list", until=start_log_id)["lines"] ):
                  printc("        [%-5s %s] [%-16s:%s] %s"%(
                      l["level"].upper(),
                      l["timestamp"][11:],

                      l["meta"].get("file", "--")[-16:], l["meta"].get("line", "--"),
                      fix_identation(l["message"], 16)
                    ), color=LEVEL_COLOR[l["level"]])
                print("\n")


                allok = False
        try:
            cli.call("plugin.stop", plugin)
        except:
            pass

    sys.exit( 0 if allok else 1 )


if __name__=='__main__':
    main()
