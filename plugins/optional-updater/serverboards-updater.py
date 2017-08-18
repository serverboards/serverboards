#!/usr/bin/python3

import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
import requests, subprocess, yaml, time, urllib.request, gzip
from serverboards import print

PLUGINS_YAML_URL="https://serverboards.io/downloads/plugins.yaml.gz"

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

plugins_state={}
plugins_state_timestamp=0
MAX_CACHE_TIME=300

@serverboards.rpc_method
def check_plugin_updates(action_id=None, **args):
    global plugins_state
    global plugins_state_timestamp

    ctime=time.time()
    print(ctime,plugins_state_timestamp,ctime-plugins_state_timestamp,MAX_CACHE_TIME)
    if plugins_state and (ctime-plugins_state_timestamp < MAX_CACHE_TIME):
        update_count=0
        for pl,changelog in plugins_state.items():
            if changelog:
                serverboards.rpc.event("event.emit","plugin.update.required", {"plugin_id": plugin_id, "payload": changelog}, ["plugin.install"])
                update_count+=1
        serverboards.info("Using cached plugin update data: %s plugins require updates"%update_count)
        return update_count

    PLUGIN_PATH=os.environ.get("SERVERBOARDS_PATH", os.environ["HOME"]+"/.local/serverboards/")+"/plugins/"
    paths=os.listdir(PLUGIN_PATH)
    paths_count=len(paths)
    update_count=0
    serverboards.info("Checking updates at %s for (maybe) %s plugins"%(PLUGIN_PATH, paths_count))
    for n, pl in enumerate(paths):
        serverboards.rpc.call("action.update", action_id, {"progress": (n*100.0/paths_count), "label": "%s (%d/%d)"%(pl, n, paths_count)})
        try:
            pl=PLUGIN_PATH+pl
            if os.path.exists(pl+"/.git/"):
                cmd="cd %s && git remote update > /dev/null && git log --oneline $(git rev-parse --abbrev-ref --symbolic-full-name @{u})...HEAD"%pl
                output=subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT)
                if output:
                    plugin_id=yaml.load(open('%s/manifest.yaml'%pl))["id"]
                    changelog=output.decode('utf8').strip()
                    payload={
                        "plugin_id": plugin_id,
                        "changelog": changelog
                    }
                    serverboards.info("Plugin %s requires update"%plugin_id)
                    serverboards.rpc.event("event.emit","plugin.update.required", payload, ["plugin.install"])
                    update_count+=1
                    plugins_state[pl]=changelog
                else:
                    plugins_state[pl]=None
        except:
            import traceback; traceback.print_exc()
    serverboards.info("%s plugins require updates"%update_count)
    plugins_state_timestamp=time.time()
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


@serverboards.rpc_method("plugin_catalog")
@serverboards.cache_ttl(60)
def plugin_catalog():
  plugins_yaml_gz = urllib.request.urlopen(PLUGINS_YAML_URL)

  plugins_yaml_raw = gzip.GzipFile(fileobj = plugins_yaml_gz).read()
  plugins = yaml.load(plugins_yaml_raw)

  return plugins

# Direct trans from util.js
def match_traits(has=[], any=[], all=[]):
  if all:
    for a in all:
      if a not in has:
        return False
  if any:
    for a in any:
      if a in has:
        return True
    return False
  return True

def maybe_list(l):
  """
  Returns the same list as received, or splits a string into a list.
  """
  if type(l)==list:
    return l
  return l.split(' ')

@serverboards.rpc_method
def component_filter(type=None, traits=None):
  plugins = plugin_catalog()
  components = []
  traits = maybe_list(traits or [])
  for pl in plugins:
    for co in pl.get("components",[]):
      # countdown, counts how many not None
      matched_filters = len([x for x in [type, traits] if x])

      if type and co.get("type")==type:
        matched_filters-=1
      if traits and match_traits(has=maybe_list(co.get("traits",[])), all=traits):
        matched_filters-=1

      if matched_filters==0:
        co["id"]="%s/%s"%(pl["id"], co["id"])
        co["plugin"]=pl["id"]
        co["giturl"]=pl["giturl"]
        components.append(co)
  return components


def update_at(path):
    serverboards.info("Updating plugin at %s"%path)
    cmd="cd %s && git reset --hard && git pull"%path
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
    print(repr( check_plugin_updates() ))


if __name__=='__main__':
    if len(sys.argv) > 1 and sys.argv[1]=="test":
        test()
    else:
        serverboards.loop()
