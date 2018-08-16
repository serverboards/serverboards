#!/usr/bin/python3
import sys
import os
import curio
import yaml
import time

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
import serverboards_aio as serverboards
from serverboards_aio import curio, rpc_method, info, service, debug

ok = True


def at_sync_world():
    time.sleep(0.2)
    return "sync"


def at_sync_call_async():
    return serverboards.run_async(at_async_world)


async def at_async_world():
    await curio.sleep(0.2)
    return "async"


@serverboards.rpc_method
async def exported():
    await curio.sleep(0.2)
    return "exported"


@serverboards.rpc_method
async def exported_with_back_call():
    data = await serverboards.call("back.call")
    return data


@serverboards.rpc_method
async def exported_with_exception():
    data = await serverboards.call("error.not.exists")
    return data


async def test():
    mock_data = yaml.load(
        open(os.path.join(os.path.dirname(__file__), "mock.yaml")))
    serverboards.test_mode(mock_data)
    print("Test", file=sys.stderr)
    global ok
    try:
        print("Call sync", file=sys.stderr)
        sync = await serverboards.sync(at_sync_world)
        assert sync == "sync"
        print("sync ok", file=sys.stderr)

        async_ = await serverboards.sync(at_sync_call_async)
        assert async_ == "async"
        print("async ok", file=sys.stderr)

        try:
            assert False
        except Exception as e:
            print("Log exception", file=sys.stderr)
            serverboards.log_traceback(e)

        exported_ = await exported()
        assert exported_ == "exported"
        print("exported ok", file=sys.stderr)

        exported_ = await exported_with_back_call()
        assert exported_ == "exported w bc"
        print("exported ok", file=sys.stderr)

        try:
            await exported_with_exception()
            assert False, "Should have excepted"
        except Exception as e:
            print(e, file=sys.stderr)

    except Exception as e:
        print("Exception", e, file=sys.stderr)

        serverboards.log_traceback(e)
        ok = False
        sys.exit(1)
    finally:
        print("Exit!", ok, file=sys.stderr)
        sys.exit(0 if ok else 1)

if __name__ == '__main__':
    serverboards.run_async(test)
    serverboards.set_debug()
    serverboards.loop(with_monitor=True)
    sys.exit(0 if ok else 1)
