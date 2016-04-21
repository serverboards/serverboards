// main.js
var React = require('react');
var ReactDOM = require('react-dom');
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'

require("../sass/serverboards.sass")
require('./rpc')

import Main from './containers/main.js'
import redux_reducers from './reducers'

var redux_middleware, redux_extra

if (__DEV__){
  console.warn("Running in DEBUG mode")

/*
  redux_middleware=applyMiddleware( store => next => action => {
    console.group(action.type)
    console.log(action)
    let result
    try{
      result = next(action)
    }
    catch(e){
      console.log("Error processing %o: %o", action.type, e)
    }
    console.log(store.getState())
    console.groupEnd(action.type)
    return result
  })
*/
  redux_extra=window.devToolsExtension ? window.devToolsExtension() : f => f
}

let store = createStore(
  redux_reducers,
  redux_middleware,
  redux_extra
)

import Flash from './flash'
import FlashActions from './actions/flash'

Flash.log=function(message, options={}){
  options=Object.assign({}, {timeout: message.length*100}, options)
  store.dispatch( FlashActions.add(message, options) )
  var close =function(){
    store.dispatch(FlashActions.remove(message))
  }
  setTimeout(close, options.timeout)
  return {close}
}

ReactDOM.render(
  (
    <Provider store={store}>
      <Main/>
    </Provider>
  ),
  document.getElementById('react')
);
