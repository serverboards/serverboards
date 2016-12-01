import Flash from 'app/flash'
import event from 'app/utils/event'

/**
 * @short Starts a new RPC connection, with the given options
 *
 * Options:
 *  * url -- Url to connect to
 *  * store -- redux store
 */
var RPC = function(options={}){
  var rpc={
    reconnect_time: 1000,
    maxid: 1,
    status: 'NOTCONNECTED',
    keep_logged_in: false,
    store: options.store,
    url: options.url,
    debug: false,
    reconnect_max: 10, // max count of reconnects, if more reload page.
    reconnection_message_queue: [], // messages to send when reconnected.
  }

  if (!rpc.url){
    const servername=localStorage.servername || window.location.origin
    if (servername.slice(0,5)=='http:')
      rpc.url="ws://"+servername.slice(7)+"/ws"
    else
      rpc.url="wss://"+servername.slice(8)+"/ws"
  }
  if (localStorage.ws_url) // Hack to connect to another server at dev.
    rpc.url=localStorage.ws_url
  if (localStorage.reconnect_token)
    sessionStorage.reconnect_token=localStorage.reconnect_token

  rpc.set_status = function(newstatus, extra=undefined){
    if (!rpc.store)
      return
    rpc.store.dispatch({type: "RPC_STATUS", status: newstatus, extra})
    rpc.status=newstatus
  }
  rpc.set_status("NOTCONNECTED")

  rpc.connect = function(){
    if (rpc.status=="RECONNECT")
      console.warn("Assert already in connecting!")
    if (rpc.debug)
      console.debug("Connect RPC to %s: %s %o", rpc.url, rpc.status, rpc)
    rpc.set_status("CONNECTING")
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
    rpc.set_status("CONNECTED")
    //if (rpc.reconnect_time>1000){
      //Flash.success("Connected to remote RPC server.")
    //}
    //console.debug("Connection success.")
    if (sessionStorage.reconnect_token){
      rpc.call('auth.auth',{type:'token',token:sessionStorage.reconnect_token}).then(function(user){
        if (user==false){
          Flash.error("Could not reauthenticate automatically. Reload.")
          delete sessionStorage.reconnect_token
          rpc.reconnection_message_queue=[]
          return
        }
        //Flash.success("Reconnection succeded.")
        event.subscribe(["user.updated"])

        require('app/actions/auth').logged_in_as(rpc.store.dispatch, user)

        // Send pending messages
        for (let msg of rpc.reconnection_message_queue){
          rpc.rpc.send( msg )
        }
        rpc.reconnection_message_queue=[]
      }).catch(function(){
        rpc.reconnection_message_queue=[]
      })
    }
    else{
      rpc.reconnection_message_queue=[]
    }

    rpc.reconnect_time=1000
  }
  rpc.onclose=function(ev){
    if (rpc.status=="RECONNECTING") // already reconnecting
      return;
    console.debug("WS closed because of %o",ev.code)
    //if (rpc.status=="CONNECTED")  Flash.debug("Closed connection")
    rpc.set_status("CLOSED")
    if (ev.code!=1000){
      //Flash.error('Error on RPC connection. Reconnect in '+(rpc.reconnect_time/1000.0)+' s')
      rpc.reconnect()
    }
  }

  rpc.onerror = function(){
    console.error("Error WS connection. %o", rpc.status)

  }
  rpc.reconnect = function(){
    rpc.reconnect_max-=1
    if (rpc.reconnect_max<0){
      //Flash.error("Tried to reconnect too many times. Will not try again. Reload page.")
      rpc.set_status("WILL_NOT_RECONNECT")
      return
    }
    console.debug("WS reconnecting %o", rpc.status)
    if (rpc.status=="RECONNECT")
      console.warn("Assert already in reconnect!")
    rpc.set_status("RECONNECT", rpc.reconnect_time)

    setTimeout(function(){
      if (rpc.status != "RECONNECT"){
        console.warn("RPC status whould be RECONNECT. It is %o. Not reconnecting.", rpc.status)
        return;
      }
      rpc.set_status("RECONNECTING")
      rpc.connect()
    }, rpc.reconnect_time)

    // the time is a exponential falloff with cut at 30s.
    rpc.reconnect_time=rpc.reconnect_time*2
    if (rpc.reconnect_time>30000)
      rpc.reconnect_time=30000
  }

  rpc.set_redux_store = function(store){
    rpc.store=store
    store.on('auth.user', function(user){
      if (user){
        if (!sessionStorage.reconnect_token){
          rpc.call("auth.create_token").then(function(token){
            //console.debug("My reconnect token is "+token)
            sessionStorage.reconnect_token=token
            if (rpc.keep_logged_in)
              localStorage.reconnect_token=token
            else{
              delete localStorage.reconnect_token
            }
          })
        }
        else{
          rpc.setup_refresh_token()
        }
      }
      else{
        //console.log("User disconnected, removing tokens")

        delete sessionStorage.reconnect_token
        delete localStorage.reconnect_token
        rpc.reconnect()
      }
    })
    rpc.store.dispatch({type: "RPC_STATUS", status: rpc.status})
  }

  var pending_calls={}

  rpc.onmessage = function(msg){
    if (rpc.debug)
      console.debug("Got: %o", msg.data)
    var jmsg = JSON.parse(msg.data)
    var id = jmsg['id']
    if (id){
      var pc = pending_calls[id]
      //console.log("Got answer: %o %o", jmsg, pc)
      if (jmsg['result'] !== undefined )
         pc[0]( jmsg['result'] )
      else if (jmsg['error']){
        console.error("Got error %o from %o", jmsg['error'], pc[2])
        pc[1]( jmsg['error'] )
      }
      else
        pc[1]( "Invalid message" )
      delete pending_calls[id]
    }
    else if (jmsg['method']){
      if (rpc.store)
        rpc.store.dispatch( Object.assign({type: `@RPC_EVENT/${jmsg.method}`}, jmsg.params) )
      rpc.trigger(jmsg.method, jmsg.params)
      if (rpc.debug)
        console.log("Event: %o %o", jmsg.method, jmsg)
    }
  }

  rpc.subscriptions = {}
  rpc.on = function(event, fn){
    rpc.subscriptions[event]=(rpc.subscriptions[event] || []).concat([fn])
  }
  rpc.off = function(event, fn){
    if (fn)
      rpc.subscriptions[event]=(rpc.subscriptions[event] || []).filter( (f) => (f != fn) )
    else
      delete rpc.subscriptions[event]
  }
  rpc.trigger = function(event, data){
    for (let fn of (rpc.subscriptions[event] || [])){
      try{
        fn(data)
      }
      catch(e){
        console.error(`Error processing event ${event}: %o`, e)
      }
    }
  }

  rpc.call = function(method, params){
    var id=rpc.maxid
    var promise = new Promise(function(resolve, reject){
      pending_calls[id]=[resolve, reject, method]
    })
    var msg = JSON.stringify({
      method: method,
      id: id,
      params: params || []
    } )
    //console.log(msg)
    try{
      if (this.debug)
        console.debug("Send: %o", msg)
      if (this.status=="CONNECTED")
        rpc.rpc.send( msg )
      else{
        rpc.reconnection_message_queue.push( msg )
      }
    }
    catch(e){
      rpc.reconnect()
    }
    rpc.maxid+=1

    return promise
  }

  rpc.close = function(){
    rpc.rpc.close()
  }

  rpc.setup_refresh_token = function(){
    // Refresh the token, and set up the refresher
    if (rpc.refresh_token_id){
      clearInterval(rpc.refresh_token_id)
    }
    rpc.refresh_token_id=setInterval(rpc.refresh_token, 1000 * 60 * 60) // Once per hour
    rpc.refresh_token()
  }

  rpc.clear_refresh_token = function(){
    clearInterval(rpc.refresh_token_id)
    rpc.refresh_token_id=undefined
  }

  rpc.refresh_token = function(){
    if (!sessionStorage.reconnect_token){
      rpc.clear_refresh_token()
    }

    rpc.call("auth.refresh_token",[sessionStorage.reconnect_token]).catch( (e) => {
      console.error("Error refreshing the connection token")
      rpc.clear_refresh_token()
    })
  }

  rpc.connect()
  return rpc
}

var rpc=RPC()

export default rpc
