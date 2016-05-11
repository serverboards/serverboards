import React from 'react'
import Link from '../../router'

var SidebarSections = function(props){
  function MenuItem(menu_props){
    let klass="item"
    if (menu_props.section==props.section)
      klass+=" active"
    return (
      <a className={klass} href={`#/settings/${menu_props.section}`}>{menu_props.children}</a>
    )
  }

  return (
    <div className="ui vertical menu sections">
      <h3 className="ui item header">Settings</h3>
      <MenuItem section="overview">Overview</MenuItem>
      <MenuItem section="users">Users</MenuItem>
      <MenuItem section="groups">Groups and permissions</MenuItem>
      <MenuItem section="system">System</MenuItem>
    </div>
  )
}

function Settings(props){
  let section = props.params.section || 'overview'
  let Section = require(`../../containers/settings/${section}`).default

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


export default Settings
