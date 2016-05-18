// using an ES6 transpiler, like babel
import React from 'react';
import { Router, Route, Link, hashHistory } from 'react-router'
import { connect } from 'react-redux'
import { syncHistoryWithStore } from 'react-router-redux'
import store from './utils/store'

import DashBoard from './components/dashboard.js'
import Profile from './containers/profile.js'
import Settings from './components/settings'
import Serverboard from './containers/serverboard'
import ServerboardAdd from './containers/serverboard/add.js'

const history = syncHistoryWithStore(hashHistory, store)

var ServerboardsRouter = React.createClass({
  render: function(){
    //console.log("Router Props: %o", this.props)
    return (
        <Router history={history}>
          <Route path="/" component={DashBoard}/>
          <Route path="/user/profile" component={Profile}/>
          <Route path="/serverboard/">
            <Route path="add" component={ServerboardAdd}/>
            <Route path=":serverboard/" component={Serverboard}/>
            <Route path=":serverboard/:section" component={Serverboard}/>
          </Route>
          <Route path="/settings/" component={Settings}>
            <Route path=":section" component={Settings}/>
          </Route>
        </Router>
      )
    }
})

export { Link }
export default ServerboardsRouter
