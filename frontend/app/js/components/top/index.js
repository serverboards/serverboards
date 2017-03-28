import React from 'react'
import UserMenu from 'app/containers/top/usermenu'
import ProcessesMenu from 'app/containers/top/processesmenu'
import NotificationsMenu from 'app/containers/top/notificationsmenu'
import {Link} from 'app/router'
import {goto} from 'app/utils/store'
import CommandSearch from './commands'
import Restricted from 'app/restricted'
import i18n from 'app/utils/i18n'
import ProjectSelector from 'app/containers/project/projectselector'

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
      open_selectproject: false
    }
  },
  componentDidMount(){
    $(this.refs.notifications_item).popup({
      popup: $(this.refs.el).find('#notifications_menu'),
      on: 'hover',
      hoverable: true,
      position: 'bottom center',
      delay: {
        show: 100,
        hide: 300
      },
      onVisible: () => this.setState({open_time: new Date()})
    })
    $(this.refs.el).find("[data-content]").popup()
  },
  toggleProjects(){
    this.setState({open_selectproject: !this.state.open_selectproject})
  },
  render(){
    const props=this.props
    const section=props.section
    let menu=undefined
    switch (props.menu){
      case 'user':
        menu=(
          <UserMenu/>
        )
        break;
      case 'processes':
        menu=(
          <ProcessesMenu/>
        )
        break;
      case 'projects':
        menu=(
          <ProjectSelector className="right"/>
        )
        break;
    }
    if (menu)
      menu=(
        <div onClick={props.closeMenu} style={{position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "none"}}>
          {menu}
        </div>
      )
    let logo=require("../../../imgs/white-horizontal-logo.svg")
    return (
      <nav className="ui top fixed menu" ref="el">
        <div className="item logo">
          <a href="#/">
            <img src={logo}/>
          </a>
        </div>

        <div className="right menu">
          <div
              className="item search"
              ref="search"
              data-content={i18n("Commands and search")}
              data-position="bottom right"
              >
            <CommandSearch/>
          </div>
          <Restricted perm="plugin.catalog">
            <a
                ref="plugins"
                onClick={() => goto("/settings/plugins")}
                className={`item ${(props.menu == 'plugins' || section == 'plugins') ? "active" : ""}`}
                data-content={i18n("Plugins")}
                data-position="bottom center"
                >
              <img className="ui icon" src={icon_plugin}/>
            </a>
          </Restricted>
          <Restricted perm="issues.view">
            <a
                className={`item ${ section == "issues" ? "active" : ""}`}
                onClick={() => goto("/issues/")}
                ref="issues"
                data-content={i18n("Issues")}
                data-position="bottom center"
                >
              <i className="warning sign icon"/>
              <span
                className={`ui micro label floating circular ${notifications_color(props.notifications)}`}
                style={{top: 8, left: 43}}
                />
            </a>
          </Restricted>
          <Restricted perm="notifications.list">
            <a
              className={`item ${section == 'notifications' ? "active" : ""}`}
              ref="notifications_item"
              >
              <i className="announcement icon"></i>
              {((props.notifications||[]).length > 0) ? (
                <span
                  className={`ui micro label floating circular ${notifications_color(props.notifications)}`}
                  style={{top: 8, left: 43}}
                  />
                ) : null}
            </a>
          </Restricted>
          <NotificationsMenu open_time={this.state.open_time}/>
          <Restricted perm="action.watch">
            <a
              className={`item ${section == 'process' ? "active" : ""}`}
              onClick={() => props.toggleMenu('processes')}
              ref="actions"
              data-content={i18n("Actions")}
              data-position="bottom center"
              >
              <i className={`spinner ${props.actions.length==0 ? "" : "loading"} icon`}/>
            </a>
          </Restricted>
          <Restricted perm="project.get">
            <a
                ref="projects"
                onClick={() => props.toggleMenu('projects')}
                className={`item ${(props.menu == 'projects' || section == 'project') ? "active" : ""}`}
                data-content={i18n("Projects")}
                data-position="bottom center"
                >
              <i className="browser icon"/>
            </a>
          </Restricted>
          <a
            className={`item ${(section == 'settings' || section == 'user' || section == 'logs') ? "active" : ""}`}
            onClick={() => props.toggleMenu('user')}
            ref="profile"
            data-content={i18n("Profile and more...")}
            data-position="bottom right"
            >
            <img src={props.avatar} className="ui circular image small" style={{width: 32, height: 32, marginTop: -6}}
              data-tooltip={props.user.email}/>
          </a>
        </div>
        {menu}
      </nav>
    )
  }
})

export default Top
