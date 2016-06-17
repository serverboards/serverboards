import React from 'react'
import rpc from 'app/rpc'
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
    return Promise.resolve("ok") // Fullfilled!
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
    return Promise.resolve("ok") // Fullfilled!
  }
}

export function subscriptions(){
  return rpc.call("event.subscriptions",[])
}

export function emit(type, args){
  return rpc.call("event.emit", [type, args])
}

/**
 * @short Same as react-redux.connect, but also adds subscriptions and updates
 *
 * * Subscriptions is a list of subscriptions
 * * Updates is a list or a function(props) -> list that sets functions
 *   to call to update state, for example list of services in a serverboard.
 */
export function subscribe_connect(state, handlers, subscriptions=[], updates=[]){
  return function(Component){
    let SubscribedConnect = React.createClass({
      contextTypes: {
        store: React.PropTypes.object
      },
      componentDidMount(){
        subscribe(subscriptions)
        if (updates){ // Call all updates
          let updates_list
          if (typeof updates == "function")
            updates_list=updates(this.props)
          else
            updates_list=updates

          updates_list.map( (u) => this.context.store.dispatch(u()) )
        }
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
