import Flash from './flash'

var RPC = function(url){
  if (!url){
    if (window.location.protocol=='http:')
      url="ws://"+window.location.host+"/ws"
    else
      url="wss://"+window.location.host+"/ws"
  }
  console.log("Connect RPC to %s", url)
  var rpc = new WebSocket(url)

  rpc.onopen=function(){
    console.log("Connection success.")

    rpc.call("ping")

  }
  rpc.onerror = function(){
    console.error("Error connection.")

    Flash.debug('Error on RPC connection.')
  }

  var pending_calls={}

  rpc.onmessage = function(msg){
    var jmsg = JSON.parse(msg.data)
    var id = jmsg['id']
    if (id){
      var pc = pending_calls[id]
      console.log("Got answer: %o %o", jmsg, pc)
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

  rpc.maxid=1

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
    console.log(msg)
    rpc.send( msg )
    rpc.maxid+=1

    return promise
  }

  return rpc
}

var rpc=RPC()

export default rpc
