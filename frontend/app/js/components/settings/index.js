import React from 'react'
import Link from 'app/router'
import Overview from 'app/containers/settings/overview'
import Users from 'app/containers/settings/users'
import Groups from 'app/containers/settings/groups'
import Plugins from 'app/containers/settings/plugins'
import System from 'app/containers/settings/system'
import Logs from 'app/containers/logs'
import Restricted from 'app/restricted'
import i18n from 'app/utils/i18n'
import {ErrorBoundary} from 'app/components/error'

const sections={
  overview: Overview,
  users: Users,
  groups: Groups,
  plugins: Plugins,
  system: System,
  logs: Logs
}

var SidebarSections = function(props){
  function MenuItem(menu_props){
    let klass="item"
    let current=[]
    if (menu_props.section==props.section){
      klass+=" active"
      current=(
        <i className="icon angle right floating right"/>
      )
    }
    return (
      <a className={klass} href={`#/settings/${menu_props.section}`}>
        {menu_props.children}
        {current}
      </a>
    )
  }

  return (
    <div className="ui vertical menu sections">
      <h3 className="ui item header">{i18n("Settings")}</h3>
      <MenuItem section="overview">{i18n("Overview")}</MenuItem>
      <Restricted perm="auth.list">
        <MenuItem section="users">{i18n("Users")}</MenuItem>
      </Restricted>
      <Restricted perm="auth.list AND auth.manage_groups">
        <MenuItem section="groups">{i18n("Groups and permissions")}</MenuItem>
      </Restricted>
      <Restricted perm="plugin.catalog">
        <MenuItem section="plugins">{i18n("Plugins")}</MenuItem>
      </Restricted>
      <Restricted perm="logs.view">
        <MenuItem section="logs">{i18n("Logs")}</MenuItem>
      </Restricted>
      <Restricted perm="settings.view">
        <MenuItem section="system">{i18n("System")}</MenuItem>
      </Restricted>
    </div>
  )
}

function Settings(props){
  let section = props.params.section || 'overview'
  let Section = sections[section]
  // console.log("Section %o", section)

  return (
    <div className="ui horizontal split area expand">
      <SidebarSections section={props.params.section} service={props.service} onSectionChange={props.handleSectionChange}/>
      <div className="ui expand vertical expand split area with scroll">
        <ErrorBoundary>
          <Section {...props} location={props.location}/>
        </ErrorBoundary>
      </div>
    </div>
  )
}


export default Settings
