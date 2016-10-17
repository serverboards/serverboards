#!/usr/bin/python

import sys, os, uuid, time, re
sys.path.append(os.path.join(os.path.dirname(__file__),'../bindings/python/'))
import serverboards

from libcloud.compute.types import Provider
from libcloud.compute.providers import get_driver

connections={}
uri_type_to_connection={}
timer_refcount={} # connhash -> (timerid, refcount)
timerid_to_connhash={} # timerid -> connhash

def connection_hash(type, **extra):
    return hash( (repr(sorted(extra.items())),type) )

@serverboards.rpc_method
def providers():
    return ['libvirt']

@serverboards.rpc_method
def connect(type, **extra):
    urik=connection_hash(type=type, **extra)
    if urik in uri_type_to_connection: # already exists
        return uri_type_to_connection[urik]

    driver = None
    if type == 'libvirt':
        cls=get_driver(Provider.LIBVIRT)
        url="qemu+ssh://%s/system"%extra['server']
        serverboards.debug("Connect to libvirt // %s"%url)
        driver=cls( url )
    elif type == 'digitalocean':
        cls=get_driver(Provider.DIGITAL_OCEAN)
        driver=cls(extra['token'], api_version='v2')
    if not driver:
        raise Exception("Could not create connexion to remote cloud provider")

    id = str(uuid.uuid4())
    connections[id]=dict( driver=driver, type=type, urik=urik, config=extra )
    uri_type_to_connection[urik]=id
    return id

@serverboards.rpc_method
def disconnect(id):
    conn=connections[id]
    del conn['driver']
    del connections[id]
    del uri_type_to_connection[conn['urik']]
    return True

def guess_icon(node):
    nodename=node.name.lower()
    if 'debian' in nodename:
        return 'debian.svg'
    if 'fedora' in nodename:
        return 'fedora.svg'
    if 'ubuntu' in nodename:
        return 'ubuntu.svg'
    if 'linux' in nodename:
        return 'linux'
    return None

def get_description(node):
    extra=node["extra"]
    desc=[]
    if 'used_memory' in extra:
        desc.append( '%s MB RAM'%(extra["used_memory"]) )
    if 'memory' in extra:
        desc.append( '%s MB RAM'%(extra["memory"]) )
    if 'disk' in extra:
        desc.append( '%.2f GB'%(extra['disk']) )
    if 'public_ips' in node:
        desc.append( ' '.join(node['public_ips']) )
    remote_desktop=extra.get('remote_desktop')
    if remote_desktop:
        desc.append( "[%s](%s)"%(remote_desktop,remote_desktop) )
    return ', '.join(x for x in desc if x)

def get_traits(node):
    if node.get('public_ips',[]):
        yield 'ssh'
    remote_desktop = node['extra'].get('remote_desktop')
    if remote_desktop:
        if remote_desktop.startswith('spice://'):
            yield 'spice'
        if remote_desktop.startswith('vnc://'):
            yield 'vnc'

def get_extra_config(node):
    d={}
    if node.get('public_ips',[]):
        d['url']=node['public_ips'][0]
    remote_desktop=node['extra'].get('remote_desktop')
    if remote_desktop:
        d['remote_desktop']=remote_desktop
    return d

def merge_dicts(a, b):
    c=a.copy()
    a.update(b)
    return a

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
            'state':node.state,
            'icon':guess_icon(node)
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
        node['extra']['remote_desktop']=get_remote_desktop_address(connection, node['id'])
        return {
            'type': 'serverboards.core.cloud/cloud.node', # optional, if not, can not be instantiated.
            'id': node['id'],
            'name': node['name'],
            'tags': [ "stopped" if node['state']=="terminated" else "running" ],
            'description': get_description(node),
            'traits': list(get_traits(node))+['core.cloud.node'],
            'config': merge_dicts({
                'node': node['id'],
                'connection': connection,
                'via':{'config':{'url': config.get('url')}}
                }, get_extra_config(node)),
            'icon': node['icon']
        }
    return [decorate(node) for node in _list(connection)]

@serverboards.rpc_method
def virtual_nodes_subscribe(**config):
    h=connection_hash(**config)
    if h in timer_refcount:
        timer_refcount[h]=(timer_refcount[h][0], timer_refcount[h][1]+1)
        return timer_refcount[h][0]

    nodes=dict( (x['id'], x) for x in virtual_nodes(**config) )
    def send_changes():
        #serverboards.rpc.debug("tick")
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


    # this subscription is via polling. If in the future there are better options, use them.
    timerid=serverboards.rpc.add_timer(10.0, send_changes)

    timerid_to_connhash[timerid]=h
    timer_refcount[h]=(timerid, 1)
    return timerid

@serverboards.rpc_method
def virtual_nodes_unsubscribe(timerid):
    h=timerid_to_connhash[timerid]
    if timer_refcount[h][1]==1:
        #serverboards.rpc.debug("Unsubscribe")
        serverboards.rpc.remove_timer(timerid)
        del timer_refcount[h]
        del timerid_to_connhash[timerid]
    else:
        timer_refcount[h]=(timer_refcount[h][0], timer_refcount[h][1]-1)
    return True

@serverboards.rpc_method
def get_remote_desktop_address(connection, node):
    driver=connections[connection]
    conn=driver['driver']
    if driver['type']=='libvirt':
        n = conn.connection.lookupByUUIDString(node)
        xmldesc = n.XMLDesc()
        options=dict( [
            (lambda l:[l[0],l[1][1:-1]])(x.split('='))
            for x in re.findall(r'<graphics([^>]+)>', xmldesc)[0].split()
            if x] )
        servername=driver['config']['server']
        if options.get('port','-1') != '-1':
            return '%s://%s:%s'%(options['type'], servername, options['port'])
    else:
        return None

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
