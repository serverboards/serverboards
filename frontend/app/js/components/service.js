import React from 'react'

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
    </div>
  )
}

var Service = function(props){
  console.log("props", props)
  return (
    <div className="ui central with menu">
      <SidebarSections section={props.params.section} service={props.service} onSectionChange={props.handleSectionChange}/>
      <div className="ui central white background">
        <h1>Service {props.service.name} {props.params.section}</h1>
      </div>
      <a onClick={props.onAdd}><i className="ui massive button plus icon floating"></i></a>
    </div>
  )
}

export default Service
