import React from 'react'
import Loading from '../loading'
import Sidebar from 'app/containers/sidebar'

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
      <a className={klass} onClick={() => props.onSectionChange(menu_props.section)}>
      {menu_props.children}
      {current}
      </a>
    )
  }

  return (
    <div className="ui vertical menu sections">
      <h3 className="ui item header">{props.serverboard.name}</h3>
      <MenuItem section="overview">Overview</MenuItem>
      <MenuItem section="services">Services</MenuItem>
      <MenuItem section="permissions">Permissions</MenuItem>
      <MenuItem section="rules">Rules</MenuItem>
      <MenuItem section="logs">Logs</MenuItem>
      <MenuItem section="settings">Settings</MenuItem>
    </div>
  )
}

var Service = function(props){
  if (!props.serverboard)
    return (
      <Loading>
      Service information.
      </Loading>
    )

  let section = props.params.section || 'default'
  let Section = require(`../../containers/serverboard/${section}`).default

  return (
    <div className="ui central with menu">
      <Sidebar/>
      <SidebarSections section={props.params.section} serverboard={props.serverboard} onSectionChange={props.handleSectionChange}/>
      <div className="ui central white background">
        <Section serverboard={props.serverboard} subsection={props.params.subsection} location={props.location}/>
      </div>
    </div>
  )
}

export default Service
