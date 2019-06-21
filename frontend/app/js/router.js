// using an ES6 transpiler, like babel
import React from 'react';
import { Router, Route, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import store, { history } from 'app/utils/store'

import DefaultView from 'app/containers/defaultview'
import Profile from 'app/containers/profile'
import Settings from 'app/components/settings'
import Project from 'app/containers/project'
import ProcessesHistory from 'app/containers/processes'
import ProcessView from 'app/containers/processes/process'
import PluginScreen from 'app/containers/plugin/screen'
import Logs from 'app/containers/logs'
import Notification from 'app/components/notifications/notification'
import NotificationList from 'app/containers/notifications/list'
import Issues from 'app/containers/issues'
import IssuesAdd from 'app/containers/issues/add'
import IssuesView from 'app/containers/issues/details'
import ServiceDetails from 'app/containers/service/details'
import Wizard from 'app/containers/project/wizard'
import { ConnectedRouter } from 'connected-react-router'

class ServerboardsRouter extends React.Component{
  render(){
    //console.log("Router Props: %o", this.props)
    return (
        <ConnectedRouter history={history}>
          <Route exact path="/" component={DefaultView}/>
          <Route exact path="/user/profile" component={Profile}/>
          <Route path="/project/">
            <Route exact path="/project/wizard" component={Wizard}/>
            <Route exact path="/project/:project/" component={Project}/>
            <Route exact path="/project/:project/:section" component={Project}/>
            <Route exact path="/project/:project/:section/:subsection" component={Project}/>
            <Route exact path="/project/:project/:section/:subsection/:service" component={Project}/>
          </Route>
          <Route exact path="/settings/" component={Settings}/>
          <Route exact path="/process/" component={ProcessesHistory}/>
          <Route path="/process/">
            <Route path="/process/history" component={ProcessesHistory}/>
            <Route path="/process/:uuid" component={ProcessView}/>
          </Route>
          <Route path="/notifications/">
            <Route path="/notifications/:id" component={Notification}/>
            <Route exact path="/notifications/" component={NotificationList}/>
          </Route>
          <Route exact path="/logs/" component={Logs}/>

          <Route exact path="/issues/" component={Issues}/>
          <Route path="/issues/">
            <Route path="/issues/add" component={IssuesAdd}/>
            <Route path="/issues/:id" component={Issues}/>
          </Route>

          <Route path="/services/">
            <Route path="/services/:id" component={ServiceDetails}/>
          </Route>

          <Route path="/s/">
            <Route path="/s/:plugin/:component" component={(props) => (
              <PluginScreen key={props.location.pathname} {...props}/>
            )}/>
          </Route>
        </ConnectedRouter>
      )
    }
}

export { Link }
export default ServerboardsRouter
