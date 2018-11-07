#!/usr/bin/python3
import sys
import asks
import serverboards_aio as serverboards
from serverboards import print
import curio
from urllib.parse import urlparse
sys.stderr = serverboards.error
asks.init('curio')
_ = str


@serverboards.rpc_method
async def web_is_up(service):
    url = service and service.get("config", {}).get("url")
    if not url:
        return {
            "status": "unconfigured",
            "message": _('The service is not properly configured as it has not an URL.')
        }
    try:
        async with curio.timeout_after(10):
            urlp = urlparse(url)
            extra = {}
            if urlp.username:
                extra["auth"] = asks.BasicAuth((urlp.username, urlp.password))
                if urlp.port:
                    port = ":" + str(urlp.port)
                else:
                    port = ""
                url = "%s://%s%s%s" % (urlp.scheme or "http", urlp.hostname, port, urlp.path)
            elif '://' not in url:
                url = "http://" + url
            res = await asks.get(url, **extra)
            code = res.status_code
            if code == 200:
                return "ok"
            if code == 401 or code == 403:
                return {
                    "status": "unauthorized",
                    "code": code,
                    "message": _('Could connect to %s but the server answered not authorized.') % url
                    }
            return {
                "status": "nok",
                "code": code,
                "message":
                    _('Could connecto to %s, but the server answered with an error status code: %s.') % (url, code)
            }
    # except asks.exceptions.SSLError:
    #     return "bad-ssl"
    # except asks.exceptions.ConnectionError:
    #     return "down"
    except curio.TaskTimeout:
        return {
            "status": "timeout",
            "message": _('Timeout connecting to %s' % url)
        }
    except Exception as e:
        if '[Errno -2]' in str(e):
            return {
                "status": "error",
                "code": str(e),
                "message": _('Can not resolve domain name at %s' % (url))
            }
        serverboards.log_traceback(e)
        return {
            "status": "error",
            "code": str(e),
            "message": _('There was an error connecting to %s: %s' % (url, str(e)))
        }


if __name__ == '__main__':
    serverboards.loop()
