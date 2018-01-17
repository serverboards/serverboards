#!/usr/bin/python3
import sys, os, requests
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards
sys.stderr = serverboards.error

@serverboards.rpc_method
def web_is_up(service):
    try:
        res = requests.get(service["config"]["url"])
        code = res.status_code
        if code == 200:
            return "ok"
        if code == 401 or code == 403:
            return "unauthorized"
        return "nok"
    except requests.exceptions.SSLError:
        return "bad-ssl"
    except requests.exceptions.ConnectionError:
        return "down"
    except:
        import traceback; traceback.print_exc()
        return "error"

if __name__=='__main__':
    serverboards.loop()
