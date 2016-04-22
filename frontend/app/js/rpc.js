import Flash from './flash'

var RPC = function(url){
  var rpc={
    reconnect_time: 1000,
    maxid: 1,
    status: 'NOTCONNECTED'
  }

  if (!url){
    if (window.location.protocol=='http:')
      rpc.url="ws://"+window.location.host+"/ws"
    else
      rpc.url="wss://"+window.location.host+"/ws"
  }
  if (localStorage.ws_url) // Hack to connect to another server at dev.
    rpc.url=localStorage.ws_url


  rpc.connect = function(){
    if (rpc.status=="RECONNECT")
      console.warn("Assert already in connecting!")
    console.debug("Connect RPC to %s: %s %o", rpc.url, rpc.status, rpc)
    rpc.status="CONNECTING"
    try{
      rpc.rpc = new WebSocket(rpc.url)
    }
    catch(e){
      console.error(e)
    }
    rpc.rpc.onopen=rpc.onopen
    rpc.rpc.onclose=rpc.onclose
    rpc.rpc.onerror=rpc.onerror
    rpc.rpc.onmessage=rpc.onmessage
  }

  rpc.onopen=function(){
    rpc.status="CONNECTED"
    if (rpc.reconnect_time>1000){
      Flash.success("Connected to remote RPC server.")
    }
    console.debug("Connection success.")

    rpc.call("ping")
    rpc.reconnect_time=1000
  }
  rpc.onclose=function(ev){
    if (rpc.status=="RECONNECTING") // already reconnecting
      return;
    console.debug("WS closed because of %o",ev.code)
    if (rpc.status=="CONNECTED")
      Flash.debug("Closed connection")
    rpc.status="CLOSED"
    if (ev.code!=1000){
      Flash.error('Error on RPC connection. Reconnect in '+(rpc.reconnect_time/1000.0)+' s')
      rpc.reconnect()
    }
  }

  rpc.onerror = function(){
    console.error("Error WS connection. %o", rpc.status)

  }
  rpc.reconnect = function(){
    console.debug("WS reconnecting %o", rpc.status)
    if (rpc.status=="RECONNECT")
      console.warn("Assert already in reconnect!")
    rpc.status="RECONNECT"

    setTimeout(function(){
      if (rpc.status != "RECONNECT"){
        console.warn("RPC status whould be RECONNECT. It is %o. Not reconnecting.", rpc.status)
        return;
      }
      rpc.status="RECONNECTING"
      rpc.connect()
    }, rpc.reconnect_time)

    // the time is a exponential falloff with cut at 30s.
    rpc.reconnect_time=rpc.reconnect_time*2
    if (rpc.reconnect_time>30000)
      rpc.reconnect_time=30000
  }

  var pending_calls={}

  rpc.onmessage = function(msg){
    var jmsg = JSON.parse(msg.data)
    var id = jmsg['id']
    if (id){
      var pc = pending_calls[id]
      //console.log("Got answer: %o %o", jmsg, pc)
      if (jmsg['result'] !== undefined )
         pc[0]( jmsg['result'] )
      else if (jmsg['error'])
        pc[1]( jmsg['error'] )
      else
        pc[1]( "Invalid message" )
      delete pending_calls[id]
    }
    else{
      console.log("Event: %o", jmsg)
    }
  }

  rpc.call = function(method, params){
    var id=rpc.maxid
    var promise = new Promise(function(resolve, reject){
      pending_calls[id]=[resolve, reject]
    })
    var msg = JSON.stringify({
      method: method,
      id: id,
      params: params || []
    } )
    //console.log(msg)
    try{
      rpc.rpc.send( msg )
    }
    catch(e){
      self.reconnect()
    }
    rpc.maxid+=1

    return promise
  }

  rpc.close = function(){
    rpc.rpc.close()
  }

  rpc.connect()
  return rpc
}

var rpc=RPC()

export default rpc
