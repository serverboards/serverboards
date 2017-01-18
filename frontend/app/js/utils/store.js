import redux_reducers from '../reducers'
import thunk from 'redux-thunk';
import rpc from '../rpc'
import { createStore, applyMiddleware, compose } from 'redux'
import { hashHistory } from 'react-router'
import { routerMiddleware, push } from 'react-router-redux'
import { merge, object_is_equal } from 'app/utils'
import React from 'react'
import Loading from 'app/components/loading'

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
 * options:
 *   state(state, props)
 *            same as redux first parameter.
 *            if the original props or state changes (from redux), its reexecuted
 *            see `watch` to limit this reexcution.
 *   promises(prevprops, nextprops)
 *            promises for the system. Caller must check if the change from
 *            prevprops to nextprops should return any promise. Only return new
 *            promises, each call can return other set of promises.--
 *   handlers(props)
 *            functions to be executed as handlers.
 *   watch(prevprops, nextprops)
 *            List of props to watch (as returned by props or original props),
 *            if any changes, do a repaint (shouldComponentUpdate). It can be also
 *            a function(prevprops, nextprops) to check if should update (true -> update).
 *   subscriptions
 *            Subscribes to serverboards events. At umount desubscribes.
 *   updates
 *              Functions to precall at componentDidMount to get the redux store
 *              data. Function must return redux actions or redux action-functions.
 */
export function connect( options, View ){
  const SBConnect = React.createClass({
    getInitialState(nextprops){
      if (!nextprops)
        nextprops = this.props

      // Get state from the store next state, and my props
      const state = this.unwrap(options.state, nextprops)
      let ret = merge(nextprops, state)

      // Get the promises, previous promises are already on the state
      let promises = this.unwrap(options.promises, this.state || {}, ret)
      for (let k in promises){
        //console.log("Resolve in promise %o", k)
        let pr=promises[k]
        ret[k]=undefined
        // trick to allow set right now, or later
        this.wait_promise=(this.wait_promise || {})
        this.wait_promise[k]=true
        let maybe_now={setState: (kv) => Object.keys(kv).map( k => { ret[k]=kv[k] } ) }
        Promise.resolve(pr).then( (v) => {
          delete this.wait_promise[k]
          let ret={}
          ret[k]=v
          //console.log("Got promise %o -> %o, still waiting: %o", k, v, Object.keys(this.wait_promise))
          maybe_now.setState(ret)
        })
        maybe_now.setState=(kv) => this.setState(kv)
      }

      // Add also the handlers
      const handlers = this.unwrap(options.handlers)
      for (let k in handlers){
        ret[k]=handlers[v](store.dispatch)
      }

      return ret
    },
    componentDidMount(){
      if (options.subscriptions){
        event.subscribe( this.unwrap(options.subscriptions) )
      }
      if (options.updates){
        this.unwrap(options.updates).map( (u) => store.dispatch(u()) )
      }

      store.subscribe( () => {
        if (this.shouldComponentUpdate(store.getState(), this.state))
          this.reloadState()
      })
    },
    componentWillUnmount(){
      if (options.subscriptions){
        event.unsubscribe( this.unwrap(options.subscriptions) )
      }
    },
    reloadState(){
      //console.log("Reload state")
      const nstate = this.getInitialState()
      if (!object_is_equal(this.state, nstate))
        this.setState( nstate )
    },
    shouldComponentUpdate(nextProps, nextState){
      if (options.watch){
        const nextprops = merge(nextProps, nextState)
        const yesno = this.unwrap(options.watch, nextprops).some( (w) => {
          if (typeof(w) == "function")
            return w(this.state, nextprops)
          return this.state[w] != nextprops[w]
        })
        //console.log("Should component update? %o %o -> %o", nextprops, this.state, yesno)
        return yesno
      }
      else{
        return true; // always update.. default behaviour
      }
    },
    unwrap(fn, arg1, arg2){ // If two args, use them, if one, use store.getState() and props, if none, use store.getState and this.props.
      if (!fn) // not existant is as an empty list
        return []
      if (typeof(fn) == "function"){
        let state, props
        if (arg1 != undefined)
          props=arg1
        else
          props=this.props
        if (arg2){
          state=props
          props=arg2
        }
        else
          state = store.getState()

        return fn(state, props) || [] // May return undefined, null or falsy
      }
      return fn
    },
    render(){
      //console.log("Render! ", Object.keys(this.wait_promise))
      if (Object.keys(this.wait_promise).length > 0)
        return <Loading>{Object.keys(this.wait_promise).join(', ')}</Loading>
      return <View {...this.state}/>
    }
  })
  return SBConnect
}

store.connect = connect

export default store
