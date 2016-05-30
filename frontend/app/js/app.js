// main.js
var React = require('react');
var ReactDOM = require('react-dom');
import { Provider } from 'react-redux'
import rpc from './rpc'
import store from './utils/store'
import plugin from './utils/plugin'

require("../sass/serverboards.sass")

import Main from './containers/main.js'

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

window.Serverboards = {
  rpc,
  store,
  Flash,
  React,
  add_screen: plugin.add_screen,
}

ReactDOM.render(
  (
    <Provider store={store}>
      <Main/>
    </Provider>
  ),
  document.getElementById('react')
);
