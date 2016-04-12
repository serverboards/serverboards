// main.js
var React = require('react');
var ReactDOM = require('react-dom');

require("!style!css!sass!../sass/serverboards.sass")

import Login from './components/login.js'

ReactDOM.render(
  (
    <Login/>
  ),
  document.getElementById('react')
);
