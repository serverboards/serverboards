import redux_reducers from '../reducers'
import thunk from 'redux-thunk';
import rpc from '../rpc'
import { createStore, applyMiddleware, compose } from 'redux'
import { hashHistory } from 'react-router'
import { routerMiddleware, push, goBack } from 'react-router-redux'
import { merge, object_is_equal } from 'app/utils'
import React from 'react'
const react_redux_connect = require('react-redux').connect
import serverboards_connect from 'app/containers/connect'

import AsyncPromises from 'app/containers/asyncpromises'
import Subscribed from 'app/containers/subscribed'
import Updaters from 'app/containers/updaters'

var redux_extra=f => f

if (__DEV__){
  console.warn("Running in DEBUG mode")

  redux_extra=window.devToolsExtension ? window.devToolsExtension() : f => f
}
//console.log(redux_extra)

// From the redux manual, resolves promised actions
const promise_middleware = store => next => action => {
  if (typeof action.then !== 'function') {
    return next(action)
  }
  return Promise.resolve(action).then(store.dispatch)
}

let store = createStore(
  redux_reducers, {},
  compose(
    applyMiddleware(promise_middleware, thunk, routerMiddleware(hashHistory)),
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
    //console.log("Check changes: %o ->? %o => %o", current_v, new_v, !object_is_equal(current_v,new_v))
    if (!object_is_equal(current_v,new_v)){
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
import {project_update_all} from '../actions/project'
store.on('auth.logged_in', function(logged_in){
  if (logged_in){
    //console.log("Logged in, gathering initial status.")

    /// Initial data gather from server
    store.dispatch( project_update_all() )
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
    url=location().pathname
  store.dispatch( push( {
    pathname: url,
    state: extradata
  }))
}

export function back(){
  store.dispatch( goBack() )
}

store.set_modal = set_modal
store.goto = goto
store.back = back

export function location(){
  return store.getState().routing.locationBeforeTransitions
}
store.location = location

function isPromise(p){
  return (p && typeof(p.then) == "function")
}

export function connect( options, View ){
  return serverboards_connect(options)(View)
}

store.connect = connect

// Wraps subscribe to catch exceptions and go on.
let subscribe_orig = store.subscribe
store.subscribe=function( f ){
  return subscribe_orig(() => {
    try{
      f()
    } catch (e) {
      console.error(e)
    }
  })
}

export default store
