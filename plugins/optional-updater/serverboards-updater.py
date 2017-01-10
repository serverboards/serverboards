#!/usr/bin/python3

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
import requests, subprocess, yaml

@serverboards.rpc_method
def latest_version(**args):
    req = requests.get("https://serverboards.io/downloads/latest.json")
    if not req.ok:
        raise Exception("Could not get latest version")
    return req.json()

@serverboards.rpc_method
def update_now(**args):
    serverboards.rpc.reply({"level": "warning", "message": "Serverboards is restarting and should reconnect shortly.\nPage reload is highly encouraged."})
    res = os.system("sudo ./serverboards-updater.sh 1>&2")
    with open("/tmp/serverboards-update.log") as fd:
        data=fd.read()
        if res == 0:
            serverboards.log("Update Serverboards result\n%s"%data)
        else:
            serverboards.error("Error updating Serverboards\n%s"%data)

@serverboards.rpc_method
def check_plugin_updates(**args):
    serverboards.rpc.reply({"level": "info", "message": "Checking plugin updates in the background."})

    PLUGIN_PATH=os.environ.get("SERVERBOARDS_PATH", os.environ["HOME"]+"/.local/serverboards/")+"/plugins/"
    for pl in os.listdir(PLUGIN_PATH):
        try:
            pl=PLUGIN_PATH+pl
            if os.path.exists(pl+"/.git/"):
                cmd="cd %s && git remote update > /dev/null && git log --oneline $(git rev-parse --abbrev-ref --symbolic-full-name @{u})...HEAD"%pl
                output=subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT)
                if output:
                    plugin_id=yaml.load(open('%s/manifest.yaml'%pl))["id"]
                    payload={
                        "plugin_id": plugin_id,
                        "changelog":output.decode('utf8').strip()
                    }
                    serverboards.info("Plugin %s requires update"%plugin_id)
                    serverboards.rpc.event("event.emit","plugin.update.required", payload, ["plugin.install"])
        except:
            import traceback; traceback.print_exc()

@serverboards.rpc_method
def update_plugin(id):
    PLUGIN_PATH=os.environ.get("SERVERBOARDS_PATH", os.environ["HOME"]+"/.local/serverboards/")+"/plugins/"
    for pl in os.listdir(PLUGIN_PATH):
        pl=PLUGIN_PATH+pl
        try:
            plugin_id=yaml.load(open('%s/manifest.yaml'%pl))["id"]
            if plugin_id == id:
                update_at(pl)
            return "ok"
        except:
            import traceback; traceback.print_exc()

def update_at(path):
    cmd="cd %s && git pull"%path
    output=subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT)
    return output

def test():
    #print(repr( latest_version() ))
    print(repr( check_plugin_updates() ))


if __name__=='__main__':
    if len(sys.argv) > 1 and sys.argv[1]=="test":
        test()
    else:
        serverboards.loop()
