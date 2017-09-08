import React from 'react'
import UserMenu from 'app/containers/top/usermenu'
import ProcessesMenu from 'app/containers/top/processesmenu'
import NotificationsMenu from 'app/containers/top/notificationsmenu'
import {Link} from 'app/router'
import {goto} from 'app/utils/store'
import CommandSearch from './commands'
import Restricted from 'app/restricted'
import i18n from 'app/utils/i18n'
import { get_last_project } from 'app/utils/project'

require("sass/top.sass")
const icon_plugin = require("../../../imgs/007-icon-plugins.svg")

function notifications_color(notifications){
  if (!notifications || notifications.length==0)
    return ""
  return "blue"
}

const Top = React.createClass({
  getInitialState(){
    return {
      open_time: undefined,
      show_popup: undefined,
    }
  },
  componentDidMount(){
    let self = this
    $(this.refs.notifications_item).popup({
      popup: this.refs.notifications_menu,
      on: 'hover',
      hoverable: true,
      position: 'bottom center',
      lastResort: true,
      delay: {
        show: 100,
        hide: 300
      },
      onVisible(){
        self.setState({
          open_time: new Date(),
          show_popup: 'notifications'
        })
      },
      onHide(){
        if (self.state.show_popup == 'notifications')
          self.setState({show_popup: undefined})
      }
    })
    $(this.refs.actions).popup({
      popup: this.refs.processes_menu,
      on: 'hover',
      hoverable: true,
      position: 'bottom center',
      lastResort: true,
      onVisible(){
        self.setState({show_popup: 'actions'})
      },
      onHide(){
        if (self.state.show_popup == 'actions')
          self.setState({show_popup: undefined})
      }
    })
    $(this.refs.profile).popup({
      popup: this.refs.profile_menu,
      on: 'hover',
      hoverable: true,
      position: 'bottom right',
      lastResort: 'bottom right'
    })
    $(this.refs.el).find("[data-content]").popup()
  },
  handleGotoProjects(){
    get_last_project()
      .then( project => project ? goto(`/project/${project}/`) : goto(`/`) )
  },
  render(){
    const props=this.props
    const section=props.section
    let logo=require("../../../imgs/favicon.png")
    return (
      <nav className="ui serverboards top menu" id="top-menu" ref="el">
        <div className="item logo">
          <a href="#/">
            <img src={logo}/>
          </a>
        </div>
        <CommandSearch/>

        <span className="item stretch"/>

        <a
            className={`item ${ section == "project" ? "active" : ""}`}
            onClick={this.handleGotoProjects}
            ref="projects"
            data-content={i18n("Project")}
            data-position="bottom center"
            id="projects"
            >
          {i18n("Projects")}
        </a>

        <Restricted perm="issues.view">
          <a
              className={`item ${ section == "issues" ? "active" : ""}`}
              onClick={() => goto("/issues/")}
              ref="issues"
              id="issues"
              data-content={i18n("Issues")}
              data-position="bottom center"
              >
            {i18n("Issues")}
            {props.new_issues ? (
              <span
                className={`ui micro label floating circular ${notifications_color(props.notifications)}`}
                />
            ) : null}
          </a>
        </Restricted>
        <Restricted perm="notifications.list">
          <a
            className={`item ${section == 'notifications' ? "active" : ""}`}
            onClick={() => goto("/notifications/list")}
            ref="notifications_item"
            id="notifications"
            >
            {i18n("Notifications")}
            {((props.notifications||[]).length > 0) ? (
              <span
                className={`ui micro label floating circular ${notifications_color(props.notifications)}`}
                />
              ) : null}
          </a>
        </Restricted>
        <Restricted perm="notifications.list">
          <div className="ui popup" ref="notifications_menu" id="notifications_menu" style={{padding:0}}>
            {this.state.show_popup == 'notifications' ? (
              <NotificationsMenu open_time={this.state.open_time}/>
            ) : null }
          </div>
        </Restricted>
        <Restricted perm="action.watch">
          <div className="ui popup" ref="processes_menu" id="processes_menu" style={{padding:0}}>
            {this.state.show_popup == 'actions' ? (
              <ProcessesMenu/>
            ) : null}
          </div>
        </Restricted>
        <Restricted perm="action.watch">
          <a
            className={`item ${section == 'process' ? "active" : ""}`}
            onClick={() => goto('/process/history')}
            ref="actions"
            id="actions"
            >
            {i18n("Processes")}
            {props.actions.length>0 ? (
              <span
                className={`ui micro label floating circular ${notifications_color(props.notifications)}`}
                />
            ) : null}
          </a>
        </Restricted>

        <Restricted perm="settings.view">
          <span className="ui item separator"/>
        </Restricted>
        <Restricted perm="settings.view">
          <a
              ref="settings"
              id="settings"
              onClick={() => goto("/settings/")}
              className={`item icon ${( section == 'settings' ) ? "active" : ""}`}
              data-content={i18n("Settings")}
              data-position="bottom center"
              >
            <i className="big setting icon"/>
          </a>
        </Restricted>
        <span className="ui item separator"/>
        <a
          className={`item icon ${( section == 'user' ) ? "active" : ""}`}
          onClick={() => props.toggleMenu('user')}
          ref="profile"
          id="profile"
          >
          <img src={props.avatar} className="ui circular image small" style={{width: 32, height: 32}}
            data-tooltip={props.user.email}/>
        </a>
        <div className="ui popup" id="profile_menu" ref="profile_menu" style={{padding:0}}>
          <UserMenu/>
        </div>
      </nav>
    )
  }
})

export default Top
