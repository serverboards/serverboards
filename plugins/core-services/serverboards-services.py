#!/usr/bin/python3
import sys
import asks
import serverboards_aio as serverboards
import curio
sys.stderr = serverboards.error
asks.init('curio')


@serverboards.rpc_method
async def web_is_up(service):
    try:
        async with curio.timeout_after(10):
            res = await asks.get(service["config"]["url"])
            code = res.status_code
            if code == 200:
                return "ok"
            if code == 401 or code == 403:
                return "unauthorized"
            return "nok"
    # except asks.exceptions.SSLError:
    #     return "bad-ssl"
    # except asks.exceptions.ConnectionError:
    #     return "down"
    except curio.TaskTimeout:
        return "timeout"
    except Exception:
        import traceback
        traceback.print_exc()
        return "error"


if __name__ == '__main__':
    serverboards.loop()
