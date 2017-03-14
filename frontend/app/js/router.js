// using an ES6 transpiler, like babel
import React from 'react';
import { Router, Route, Link, hashHistory } from 'react-router'
import { connect } from 'react-redux'
import { syncHistoryWithStore } from 'react-router-redux'
import store from 'app/utils/store'

import DashBoard from 'app/containers/dashboard'
import Profile from 'app/containers/profile'
import Settings from 'app/components/settings'
import Serverboard from 'app/containers/project'
import ServerboardAdd from 'app/containers/project/add'
import ProcessesHistory from 'app/containers/processes'
import ProcessView from 'app/containers/processes/process'
import PluginScreen from 'app/components/plugin/screen'
import Logs from 'app/containers/logs'
import Notification from 'app/components/notifications/notification'
import NotificationList from 'app/containers/notifications/list'
import Issues from 'app/containers/issues'
import IssuesAdd from 'app/containers/issues/add'
import IssuesView from 'app/containers/issues/details'
import ServiceDetails from 'app/containers/service/details'

const history = syncHistoryWithStore(hashHistory, store)

var ServerboardsRouter = React.createClass({
  render(){
    //console.log("Router Props: %o", this.props)
    return (
        <Router history={history}>
          <Route path="/" component={DashBoard}/>
          <Route path="/user/profile" component={Profile}/>
          <Route path="/project/">
            <Route path="add" component={ServerboardAdd}/>
            <Route path=":project/" component={Serverboard}/>
            <Route path=":project/:section" component={Serverboard}/>
            <Route path=":project/:section/:subsection" component={Serverboard}/>
          </Route>
          <Route path="/settings/" component={Settings}>
            <Route path=":section" component={Settings}/>
          </Route>
          <Route path="/process/">
            <Route path="history" component={ProcessesHistory}/>
            <Route path=":uuid" component={ProcessView}/>
            <Route path="" component={ProcessesHistory}/>
          </Route>
          <Route path="/notifications/">
            <Route path="list" component={NotificationList}/>
            <Route path=":id" component={Notification}/>
          </Route>
          <Route path="/logs/" component={Logs}/>

          <Route path="/issues/" component={Issues}/>
          <Route path="/issues/">
            <Route path="add" component={IssuesAdd}/>
            <Route path=":id" component={IssuesView}/>
          </Route>

          <Route path="/services/">
            <Route path=":id" component={ServiceDetails}/>
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
