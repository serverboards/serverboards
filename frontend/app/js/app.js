// main.js
var React = require('react');
var ReactDOM = require('react-dom');
import { Provider } from 'react-redux'
import { createStore, applyMiddleware } from 'redux'

require("../sass/serverboards.sass")
require('./rpc')

import Router  from './router'
import FlashMessageList from './containers/flashmessages'
import redux_reducers from './reducers'

let store = createStore(
   redux_reducers,
   applyMiddleware( store => next => action => {
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
 )

import Flash from './flash'
import FlashActions from './actions/flash'

Flash.log=function(message, options={}){
  options=Object.assign({}, {timeout: 10000}, options)
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
      <div>
        <FlashMessageList/>
        <Router/>
      </div>
    </Provider>
  ),
  document.getElementById('react')
);
