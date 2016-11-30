// main.js
var React = require('react');
var ReactDOM = require('react-dom');
import { Provider } from 'react-redux'
import rpc from 'app/rpc'
import store from 'app/utils/store'
import plugin from 'app/utils/plugin'
import Command from 'app/utils/command'
import {pretty_ago} from 'app/utils'
import moment from 'moment'
import * as d3 from 'd3'
import graphs from 'app/graphs'
import perms from 'app/utils/perms'
require('moment-range');

require("sass/serverboards.sass")

import Main from 'app/containers/main.js'

import Flash from 'app/flash'
import FlashActions from 'app/actions/flash'

Flash.log=function(message, options={}){
  options=Object.assign({level: "success"}, {timeout: 1000 + (message.length*200)}, options)
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
  ReactDOM,
  Components: require("app/components/export").default,
  utils: require("app/utils"),
  location: { goto: require('app/utils/store').goto },
  add_screen: plugin.add_screen,
  add_widget: plugin.add_widget,
  add_command_search: Command.add_command_search,
  pretty_ago,
  plugin,
  moment,
  d3,
  graphs,
  perms
}

ReactDOM.render(
  (
    <Provider store={store}>
      <Main/>
    </Provider>
  ),
  document.getElementById('react')
);
