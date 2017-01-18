import redux_reducers from '../reducers'
import thunk from 'redux-thunk';
import rpc from '../rpc'
import { createStore, applyMiddleware, compose } from 'redux'
import { hashHistory } from 'react-router'
import { routerMiddleware, push } from 'react-router-redux'
import { merge, object_is_equal } from 'app/utils'
import React from 'react'
const react_redux_connect = require('react-redux').connect
import AsyncPromises from 'app/containers/asyncpromises'
import Subscribed from 'app/containers/subscribed'

var redux_extra=f => f

if (__DEV__){
  console.warn("Running in DEBUG mode")

  redux_extra=window.devToolsExtension ? window.devToolsExtension() : f => f
}
//console.log(redux_extra)

let store = createStore(
  redux_reducers, {},
  compose(
    applyMiddleware(thunk, routerMiddleware(hashHistory)),
    redux_extra
  )
)

//console.log(store)

function get_value(what){
  function get_value_r(whatl, state){
    if (whatl.length==1)
      return state[whatl[0]]
    return get_value_r(whatl.slice(1), state[whatl[0]])
  }
  return get_value_r(what.split('.'), store.getState())
}

function object_equals(o1, o2){
  let to1=typeof(o1)
  let to2=typeof(o2)
  //console.log("Compare %o==%o, %o==%o", o1, o2, to1, to2)
  if (to1=='undefined' && to2=='undefined')
    return true // Not really true, but it is for our use case
  if (to1!=to2)
    return false;

  if (to1=='object'){
    if ('_d' in o1)
      return o1._d == o2._d
    let k
    for(k in o1){
      if (k.slice(2)!='__')
        if (!object_equals(o1[k], o2[k]))
          return false;
    }
    return true
  }
  return o1==o2
}

/**
 * @short Adds simple .on(what, f) observer
 *
 * It observes for changes in the state, and when change,
 * calls the f(new_value).
 */
store.on=function(what, f){
  let current_v
  try{
    current_v=get_value(what)
  } catch(e){
    console.warn("Error getting initial value %o from store. Using undefined.\n%o",what, e )
  }
  // And subscribe
  return store.subscribe(function(){
    let new_v
    try{
      new_v=get_value(what)
    } catch(e){
      //console.warn("Error getting value %o from store. Using undefined.\n%o",what, e )
    }
    //console.log("Check changes: %o ->? %o => %o", current_v, new_v, !object_equals(current_v,new_v))
    if (!object_equals(current_v,new_v)){
      current_v=new_v
      //console.log("Changed status %o != %o", current_v, new_v)
      try{
        f(new_v)
      }
      catch(e){
        console.error("Error on %o observer: %o", what, e)
      }
    }
  })
}

rpc.set_redux_store(store)

/// Initial store status
import {serverboard_update_all} from '../actions/serverboard'
store.on('auth.logged_in', function(logged_in){
  if (logged_in){
    //console.log("Logged in, gathering initial status.")

    /// Initial data gather from server
    store.dispatch( serverboard_update_all() )
  }
})

export function set_modal(modal, data={}){
  const pathname=store.getState().routing.locationBeforeTransitions.pathname
  store.dispatch( push( {
    pathname: pathname,
    state: { modal, data }
  } ) )
}

export function goto(url, extradata={}){
  if (!url || url == ".")
    url=store.getState().routing.locationBeforeTransitions.pathname
  store.dispatch( push( {
    pathname: url,
    state: extradata
  }))
}

store.set_modal = set_modal
store.goto = goto

function isPromise(p){
  return (p && typeof(p.then) == "function")
}

/**
 * Expanded version of redux.connect
 *
 * I allow to do the same, but also some other
 * required funcionality, as request state, use promises for state, improved
 * propery change detection.
 *
 * To use it as a replacement, use state and handlers options.
 *
 * All options can be a list/map or a function(props, state). If its a function
 * it will be reexcuted for every state or props change (see watch), and the
 * result used.
 *
 * It creates a layered system where:
 *  1. Do subscriptions
 *  2. Get state using react redux
 *  3. Get the promises
 *
 * options:
 *   state(state, props)
 *            same as redux first parameter.
 *            if the original props or state changes (from redux), its reexecuted
 *            see `watch` to limit this reexcution.
 *   handlers(props)
 *            functions to be executed as handlers.
 *   promises(props)
 *            promises for the system. Will be reloaded if the state changes.
 *   subscriptions
 *            Subscribes to serverboards events. At umount desubscribes.
 */
export function connect( options, View ){
  let L1, L2, L3
  if (options.promises){
    L3 = (props) => (
      <AsyncPromises promises={options.promises} component={View} {...props}/>
    )
  }
  else{
    L3 = View
  }

  L2 = react_redux_connect(options.state, options.handlers)(L3)

  if (options.subscriptions){

    L1 = (props) => (
      <Subscribed subscriptions={options.subscriptions} {...props}/>
    )
  }
  else{
    L1 = L2
  }

  return L1
}

store.connect = connect

export default store
