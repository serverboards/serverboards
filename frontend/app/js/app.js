// main.js
var React = require('react');
var ReactDOM = require('react-dom');

require("!style!css!sass!../sass/serverboards.sass")
require('./rpc')

import Router  from './router'
import FlashMessageList from './containers/flashmessages'

ReactDOM.render(
  (
    <div>
      <FlashMessageList/>
      <Router/>
    </div>
  ),
  document.getElementById('react')
);
