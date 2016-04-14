// main.js
var React = require('react');
var ReactDOM = require('react-dom');
import { Provider } from 'react-redux'
import { createStore } from 'redux'

require("!style!css!sass!../sass/serverboards.sass")
require('./rpc')

import Router  from './router'
import FlashMessageList from './containers/flashmessages'
import redux_reducers from './reducers'

let store = createStore( redux_reducers )

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
