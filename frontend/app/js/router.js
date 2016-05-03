// using an ES6 transpiler, like babel
import React from 'react';
import { Router, Route, Link, hashHistory } from 'react-router'
import { connect } from 'react-redux'
import { syncHistoryWithStore } from 'react-router-redux'
import store from './utils/store'

import Empty from './components/empty.js'
import Profile from './containers/profile.js'
import Service from './containers/service.js'

const history = syncHistoryWithStore(hashHistory, store)

var ServerboardsRouter = React.createClass({
  render: function(){
    //console.log("Router Props: %o", this.props)
    return (
        <Router history={history}>
          <Route path="/" component={Empty}/>
          <Route path="/user/profile" component={Profile}/>
          <Route path="/service/">
            <Route path=":service/" component={Service}/>
            <Route path=":service/:section" component={Service}/>
          </Route>
        </Router>
      )
    }
})

export { Link }
export default ServerboardsRouter
