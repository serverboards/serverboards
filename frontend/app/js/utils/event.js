import React from 'react'
import rpc from '../rpc'
import { connect } from 'react-redux'

let subscriptions={}

export function subscribe(types){
  let newsubs=[]
  for(let t of types){
    if (!subscriptions[t])
      newsubs.push(t)
    subscriptions[t]=(subscriptions[t] || 0)+1
  }
  if (newsubs.length!=0){
    console.log("Subscribe to %o", newsubs)
    return rpc.call("event.subscribe", newsubs)
  }
  else{
    return new Promise("ok") // Fullfilled!
  }
}

export function unsubscribe(types){
  let newunsubs=[]
  for(let t of types){
    if (subscriptions[t]==1)
      newunsubs.push(t)
    subscriptions[t]=(subscriptions[t] || 0)-1
  }
  if (newunsubs.length!=0){
    console.log("Unsubscribe to %o", newunsubs)
    return rpc.call("event.unsubscribe", newunsubs)
  }
  else{
    return new Promise("ok") // Fullfilled!
  }
}

export function subscriptions(){
  return rpc.call("event.subscriptions",[])
}

export function emit(type, args){
  return rpc.call("event.emit", [type, args])
}

export function subscribe_connect(state, handlers, subscriptions, updates){
  return function(Component){
    let SubscribedConnect = React.createClass({
      contextTypes: {
        store: React.PropTypes.object
      },
      componentDidMount(){
        subscribe(subscriptions)
        if (updates) // Call all updates
          updates.map( (u) => this.context.store.dispatch(u()) )
      },
      componentWillUnmount(){
        unsubscribe(subscriptions)
      },
      render(){
        return (
          <Component {...this.props}/>
        )
      }
    })
    return connect(state, handlers)(SubscribedConnect)
  }
}

export default {subscribe, unsubscribe, subscriptions, emit, subscribe_connect}
