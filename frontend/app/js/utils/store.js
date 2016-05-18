import redux_reducers from '../reducers'
import thunk from 'redux-thunk';
import rpc from '../rpc'
import { createStore, applyMiddleware, compose } from 'redux'
import { hashHistory } from 'react-router'
import { routerMiddleware } from 'react-router-redux'

var redux_extra

if (__DEV__){
  console.warn("Running in DEBUG mode")

  redux_extra=window.devToolsExtension ? window.devToolsExtension() : f => f
}

let store = createStore(
  redux_reducers, {},
  compose(
    applyMiddleware(thunk, routerMiddleware(hashHistory)),
    redux_extra
  )
)

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
 * calls the f.
 */
store.on=function(what, f){
  let current_v=get_value(what)
  store.subscribe(function(){
    let new_v=get_value(what)
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
    console.log("Logged in, gathering initial status.")

    /// Initial data gather from server
    store.dispatch( serverboard_update_all() )
  }
})


export default store
