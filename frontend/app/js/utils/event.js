import React from 'react'
import rpc from 'app/rpc'
import { connect } from 'react-redux'
import { object_is_equal } from 'app/utils'
import serverboards_connect from 'app/containers/connect'

// Count of subscribers to one event, to subscribe again or desuscribe, or do nothing
let subscription_count={}
// Functions to call at event
let subscription_fns={}

export function subscribe(types){
  let newsubs=[]
  for(let t of types){
    if (!subscription_count[t])
      newsubs.push(t)
    subscription_count[t]=(subscription_count[t] || 0)+1
  }
  if (newsubs.length!=0){
    //console.log("Subscribe to %o", newsubs)
    return rpc.call("event.subscribe", newsubs)
  }
  else{
    return Promise.resolve("ok") // Fullfilled!
  }
}

export function unsubscribe(types){
  let newunsubs=[]
  for(let t of types){
    if (subscription_count[t]==1)
      newunsubs.push(t)
    subscription_count[t]=(subscription_count[t] || 0)-1
  }
  if (newunsubs.length!=0){
    //console.log("Unsubscribe to %o", newunsubs)
    return rpc.call("event.unsubscribe", newunsubs)
  }
  else{
    return Promise.resolve("ok") // Fullfilled!
  }
}

export function on(event, fn){
  subscribe([event])
  subscription_fns[event]=(subscription_fns[event] || []).concat([fn])
  return fn
}
export function off(event, fn){
  unsubscribe([event])
  if (fn)
    subscription_fns[event]=(subscription_fns[event] || []).filter( (f) => (f != fn) )
  else
    delete subscription_fns[event]
}
export function trigger(event, data){
  //console.log("Trigger event %o(%o)", event, data)
  for (let fn of (subscription_fns[event] || [])){
    if (fn){
      try{
        //console.log("Call %o", fn)
        fn(data)
      }
      catch(e){
        console.error(`Error processing event ${event}: %o`, e)
      }
    }
  }
}

export function subscriptions(){
  return rpc.call("event.subscriptions",[])
}

export function emit(type, args){
  return rpc.call("event.emit", [type, args])
}

const event = {subscribe, unsubscribe, subscriptions, emit, on, off, trigger}
// Inject the event manager into the RPC, required for triggers and some events
rpc.set_event( event )

export default event
