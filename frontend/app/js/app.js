// main.js
var React = require('react');
var ReactDOM = require('react-dom');
import { Provider } from 'react-redux'
import rpc from './rpc'
import store from './utils/store'

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

ReactDOM.render(
  (
    <Provider store={store}>
      <Main/>
    </Provider>
  ),
  document.getElementById('react')
);
