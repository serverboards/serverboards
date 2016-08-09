#!/usr/bin/python

import sys, os, uuid, time
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards

from libcloud.compute.types import Provider
from libcloud.compute.providers import get_driver

connections={}
uri_type_to_connection={}

@serverboards.rpc_method
def providers():
    return ['libvirt']

@serverboards.rpc_method
def connect(type, **extra):
    urik=hash( (repr(sorted(extra.items())),type) )
    if urik in uri_type_to_connection: # already exists
        return uri_type_to_connection[urik]

    driver = None
    if type == 'libvirt':
        cls=get_driver(Provider.LIBVIRT)
        driver=cls( "qemu+ssh://%s/system"%extra['server'] )
    elif type == 'digitalocean':
        cls=get_driver(Provider.DIGITAL_OCEAN)
        driver=cls(extra['token'], api_version='v2')
    if not driver:
        raise Exception("Could not create connexion to remote cloud provider")

    id = str(uuid.uuid4())
    connections[id]=dict( driver=driver, type=type, urik=urik )
    uri_type_to_connection[urik]=id
    return id

@serverboards.rpc_method
def disconnect(id):
    conn=connections[id]
    del conn['driver']
    del connections[id]
    del uri_type_to_connection[conn['urik']]
    return True

@serverboards.rpc_method("list")
def _list(uuid=None):
    if uuid is None:
        lists=[_list(uuid) for uuid in connections.keys()]
        return reduce(list.__add__, lists, [])
    driver=connections[uuid]['driver']
    def decorate(node):
        return {
            'connection':uuid,
            'name':node.name,
            'id':node.uuid,
            'extra':node.extra,
            'private_ips':node.private_ips,
            'public_ips':node.public_ips,
            'created_at':str(node.created_at),
            'state':node.state
        }

    return [decorate(node) for node in driver.list_nodes()]

@serverboards.rpc_method
def start(connection, node):
    driver=connections[connection]
    conn=driver['driver']
    return conn.ex_start_node( conn.ex_get_node_by_uuid(node) )

@serverboards.rpc_method
def force_stop(connection, node):
    driver=connections[connection]
    conn=driver['driver']
    if driver['type']=='libvirt':
        n = conn.connection.lookupByUUIDString(node)
        n.destroy()
        return True
    return conn.ex_stop_node( conn.ex_get_node_by_uuid(node) )

@serverboards.rpc_method
def shutdown(connection, node):
    driver=connections[connection]
    conn=driver['driver']
    return conn.ex_shutdown_node( conn.ex_get_node_by_uuid(node) )

@serverboards.rpc_method
def reboot(connection, node):
    driver=connections[connection]
    conn=driver['driver']
    return conn.reboot_node( conn.ex_get_node_by_uuid(node) )

def test():
    #uuid=connect(uri="qemu:///system",type="libvirt")
    uuid=connect(uri="qemu+ssh://dmoreno@localhost/system",type="libvirt")
    print(_list())
    print(disconnect(uuid))

    uuid=connect(uri="qemu+ssh://dmoreno@localhost/system",type="libvirt")
    # reconnect
    assert uuid==connect(uri="qemu+ssh://dmoreno@localhost/system",type="libvirt")

    l = _list(uuid)
    print(l)
    node = l[0]['id']
    time.sleep(1)
    try:
        print(start(uuid,node))
    except:
        import traceback; traceback.print_exc()
    time.sleep(1)
    print(reboot(uuid,node))
    time.sleep(1)
    print(shutdown(uuid,node))
    time.sleep(1)
    try:
        print(force_stop(uuid,node))
    except:
        import traceback; traceback.print_exc()
    print(disconnect(uuid))
    print(_list())


def main():
    serverboards.loop()

if __name__=='__main__':
    if len(sys.argv)>=2 and sys.argv[1] == 'test':
        test()
    else:
        main()
