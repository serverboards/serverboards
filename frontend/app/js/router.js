// using an ES6 transpiler, like babel
import React from 'react';
import { Router, Route, Link, hashHistory } from 'react-router'
import { connect } from 'react-redux'
import Empty from './components/empty.js'

import Profile from './containers/profile.js'

var ServerboardsRouter = React.createClass({
  render: function(){
    console.log("Router Props: %o", this.props)
    return (
        <Router history={hashHistory}>
          <Route path="/" component={Empty}/>
          <Route path="/user/profile" component={Profile}/>
        </Router>
      )
    }
})

export { Link }
export default ServerboardsRouter
