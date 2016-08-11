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

@serverboards.rpc_method
def virtual_nodes(**config):
    connection = connect(**config)
    def decorate(node):
        serverboards.rpc.debug(repr(node))
        return {
            'type': 'serverboards.core.cloud/cloud.node', # optional, if not, can not be instantiated.
            'id': node['id'],
            'name': node['name'],
            'tags': [ "stopped" if node['state']=="terminated" else "running" ],
            'traits': ['core.cloud.node'],
            'config': {
                'node': node['id'],
                'connection': connection
                }
        }
    return [decorate(node) for node in _list(connection)]

@serverboards.rpc_method
def virtual_nodes_subscribe(**config):
    nodes=dict( (x['id'], x) for x in virtual_nodes(**config) )
    def send_changes():
        serverboards.rpc.debug("tick")
        changes=[]
        nnodes=dict( (x['id'], x) for x in virtual_nodes(**config) )

        for (k,v) in nnodes.items():
            if not k in nodes:
                changes.append(v) # added
                nodes[k]=v
            elif v != nodes[k]:
                changes.append(v) # changed
                nodes[k]=v
        for k in nodes.keys(): # removed
            if not k in nnodes:
                changes.append({'id':k, '_removed': True})
                del nodes[k]

        for c in changes:
            serverboards.rpc.event("event.emit", "service.updated", {"service":c})


    return serverboards.rpc.add_timer(1.0, send_changes)

@serverboards.rpc_method
def virtual_nodes_unsubscribe(timerid):
    serverboards.rpc.remove_timer(timerid)
    return True

def test():

    tid=virtual_nodes_subscribe(type="libvirt",server="localhost")
    serverboards.rpc.set_debug(sys.stderr)
    serverboards.rpc.loop()


    #uuid=connect(uri="qemu:///system",type="libvirt")
    uuid=connect(type="libvirt",server="localhost")
    print(_list())
    print(disconnect(uuid))

    uuid=connect(type="libvirt",server="localhost")
    # reconnect
    assert uuid==connect(type="libvirt",server="localhost")

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
    #serverboards.rpc.set_debug(sys.stderr)
    serverboards.loop()

if __name__=='__main__':
    if len(sys.argv)>=2 and sys.argv[1] == 'test':
        test()
    else:
        main()
