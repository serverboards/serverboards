import React from 'react'
import Loading from './loading'

require("../../sass/service.sass")

var SidebarSections = function(props){
  function MenuItem(menu_props){
    let klass="item"
    if (menu_props.section==props.section)
      klass+=" active"
    return (
      <a className={klass} onClick={() => props.onSectionChange(menu_props.section)}>{menu_props.children}</a>
    )
  }

  return (
    <div className="ui vertical menu sections">
      <h3 className="ui item header">{props.service.name}</h3>
      <MenuItem section="overview">Overview</MenuItem>
      <MenuItem section="components">Components</MenuItem>
      <MenuItem section="permissions">Permissions</MenuItem>
      <MenuItem section="rules">Rules</MenuItem>
      <MenuItem section="logs">Logs</MenuItem>
      <MenuItem section="settings">Settings</MenuItem>
    </div>
  )
}

var Service = function(props){
  if (!props.service)
    return (
      <Loading>
      Service information.
      </Loading>
    )

  let section = props.params.section || 'default'
  let Section = require(`../containers/service/${section}`).default

  return (
    <div className="ui central with menu">
      <SidebarSections section={props.params.section} service={props.service} onSectionChange={props.handleSectionChange}/>
      <div className="ui central white background">
        <Section service={props.service}/>
      </div>
      <a onClick={props.onAdd}><i className="ui massive button plus icon floating"></i></a>
    </div>
  )
}

export default Service
