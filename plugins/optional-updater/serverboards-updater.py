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
def check_plugin_updates(action_id=None, **args):
    PLUGIN_PATH=os.environ.get("SERVERBOARDS_PATH", os.environ["HOME"]+"/.local/serverboards/")+"/plugins/"
    paths=os.listdir(PLUGIN_PATH)
    paths_count=len(paths)
    update_count=0
    serverboards.info("Checking updates at %s for (maybe) %s plugins"%(PLUGIN_PATH, paths_count))
    for n, pl in enumerate(paths):
        serverboards.rpc.call("action.update", action_id, {"progress": (n*100.0/paths_count), "label": pl})
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
                    update_count+=1
        except:
            import traceback; traceback.print_exc()
    serverboards.info("%s plugins require updates"%update_count)
    return update_count


@serverboards.rpc_method
def update_plugin(action_id=None, plugin_id=None):
    PLUGIN_PATH=os.environ.get("SERVERBOARDS_PATH", os.environ["HOME"]+"/.local/serverboards/")+"/plugins/"
    for pl in os.listdir(PLUGIN_PATH):
        pl=PLUGIN_PATH+pl
        current_plugin_id=yaml.load(open('%s/manifest.yaml'%pl))["id"]
        if current_plugin_id == plugin_id:
            update_at(pl)
            return "ok"
    raise Exception("not-found")

def update_at(path):
    serverboards.info("Updating plugin at %s"%path)
    cmd="cd %s && git pull"%path
    try:
        output=subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        serverboards.error("Error updating %s: %s"%(path, e.output))
        raise Exception("cant-update")
    serverboards.info("Updated plugin at %s: %s"%(path, output))
    return output

def test():
    #print(repr( latest_version() ))
    print(repr( check_plugin_updates() ))


if __name__=='__main__':
    if len(sys.argv) > 1 and sys.argv[1]=="test":
        test()
    else:
        serverboards.loop()
