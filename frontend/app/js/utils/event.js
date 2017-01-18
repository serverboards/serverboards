import React from 'react'
import rpc from 'app/rpc'
import { connect } from 'react-redux'
import { object_is_equal } from 'app/utils'


// Count of subscribers to one event, to subscribe again or desuscribe, or do nothing
let subscription_count={}
// Functions to call at event
let subscription_fns={}

export function subscribe(types){
  console.log("Subscribe %o", types)

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
}
export function off(event, fn){
  unsubscribe([event])
  if (fn)
    subscription_fns[event]=(subscription_fns[event] || []).filter( (f) => (f != fn) )
  else
    delete subscription_fns[event]
}
export function trigger(event, data){
  console.log("Trigger event %o(%o)", event, data)
  for (let fn of (subscription_fns[event] || [])){
    if (fn){
      try{
        console.log("Call %o", fn)
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

/**
 * @short Same as react-redux.connect, but also adds subscriptions and updates
 *
 * * Subscriptions is a list of subscriptions
 * * Updates is a list or a function(props) -> list that sets functions
 *   to call to update state, for example list of services in a serverboard.
 */
export function subscribe_connect(state, handlers, subscriptions=[], updates=[], watch_props=undefined){
  return function(Component){
    let SubscribedConnect = React.createClass({
      contextTypes: {
        store: React.PropTypes.object
      },
      _componentDidMount(props){ // Wrapper to allow call with specific props
        if (subscriptions){
          let subscription_list
          if (typeof subscriptions == "function")
            subscription_list=subscriptions(props)
          else
            subscription_list=subscriptions
          subscribe(subscription_list)
        }

        if (updates){ // Call all updates
          let updates_list
          if (typeof updates == "function")
            updates_list=updates(props)
          else
            updates_list=updates

          updates_list.map( (u) => this.context.store.dispatch(u) )
        }
      },
      _componentWillUnmount(props){ // Wrapper to allow call with specific props
        if (subscriptions){
          let subscription_list
          if (typeof subscriptions == "function")
            subscription_list=subscriptions(props)
          else
            subscription_list=subscriptions
          unsubscribe(subscription_list)
        }
      },
      componentDidMount(){
        this._componentDidMount(this.props)
      },
      componentWillUnmount(){
        this._componentWillUnmount(this.props)
      },
      componentWillReceiveProps(newprops){
        if (!watch_props)
          return;
        let update=false
        watch_props.map( (p) => {
          if (!object_is_equal(this.props[p], newprops[p]))
            update=true
        })
        if (update){
          console.log("Update props")
          this._componentDidMount(newprops)
          this._componentWillUnmount(this.props)
        }
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

const event = {subscribe, unsubscribe, subscriptions, emit, subscribe_connect, on, off, trigger}
// Inject the event manager into the RPC, required for triggers and some events
rpc.set_event( event )

export default event
