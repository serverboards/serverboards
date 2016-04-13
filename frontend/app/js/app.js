// main.js
var React = require('react');
var ReactDOM = require('react-dom');

require("!style!css!sass!../sass/serverboards.sass")
require('./rpc')

import Main from './components/main.js'

ReactDOM.render(
  (
    <Main/>
  ),
  document.getElementById('react')
);
