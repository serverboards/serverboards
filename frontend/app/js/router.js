// using an ES6 transpiler, like babel
import React from 'react';
import { Router, Route, Link, hashHistory } from 'react-router'
import { connect } from 'react-redux'
import { syncHistoryWithStore } from 'react-router-redux'
import store from 'app/utils/store'

import DashBoard from 'app/components/dashboard'
import Profile from 'app/containers/profile'
import Settings from 'app/components/settings'
import Serverboard from 'app/containers/serverboard'
import ServerboardAdd from 'app/containers/serverboard/add'
import ProcessesHistory from 'app/components/processes'
import ProcessView from 'app/components/processes/process'
import PluginScreen from 'app/components/plugin/screen'

const history = syncHistoryWithStore(hashHistory, store)

var ServerboardsRouter = React.createClass({
  render(){
    //console.log("Router Props: %o", this.props)
    return (
        <Router history={history}>
          <Route path="/" component={DashBoard}/>
          <Route path="/user/profile" component={Profile}/>
          <Route path="/serverboard/">
            <Route path="add" component={ServerboardAdd}/>
            <Route path=":serverboard/" component={Serverboard}/>
            <Route path=":serverboard/:section" component={Serverboard}/>
            <Route path=":serverboard/:section/:subsection" component={Serverboard}/>
          </Route>
          <Route path="/settings/" component={Settings}>
            <Route path=":section" component={Settings}/>
          </Route>
          <Route path="/process/">
            <Route path="history" component={ProcessesHistory}/>
            <Route path=":uuid" component={ProcessView}/>
            <Route path="" component={ProcessesHistory}/>
          </Route>
          <Route path="/s/">
            <Route path=":plugin/:component" component={PluginScreen}/>
          </Route>
        </Router>
      )
    }
})

export { Link }
export default ServerboardsRouter
