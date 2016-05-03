import React from 'react';

require("../../sass/sidebar.sass")

function logo(name){
  return name.slice(0,2).toUpperCase()
}

var SidebarServices = function(props){
  var services=[
    {shortname:"SBDSSBDSSBDSSBDS", name:"Serverboards"},
    {shortname:"HMTV", name:"Healthmotiv"},
    {shortname:"IBT", name:"Ibertabac"},
    {shortname:"CRLBTS", name:"Coralbits"},
    {shortname:"AISOY", name:"Aisoy"},
    {shortname:"SBDS", name:"Serverboards"},
    {shortname:"HMTV", name:"Healthmotiv"},
    {shortname:"IBT", name:"Ibertabac"},
    {shortname:"CRLBTS", name:"Coralbits"},
    {shortname:"AISOY", name:"Aisoy"},
    {shortname:"SBDS", name:"Serverboards"},
    {shortname:"HMTV", name:"Healthmotiv"},
    {shortname:"IBT", name:"Ibertabac"},
    {shortname:"CRLBTS", name:"Coralbits"},
    {shortname:"AISOY", name:"Aisoy"},
  ]

  var service = function(service){
    return (
      <a className="item" title={service.name}>
        <span className="logo">{logo(service.name)}</span>
        {service.shortname}
      </a>
    )
  }

  return (
    <div className="ui vertical labeled icon menu services">
      {services.map(service)}
    </div>
  )
}

var SidebarSections = function(props){
  return (
    <div className="ui vertical menu sections">
      <h3 className="ui item header">Serverboards</h3>
      <a className="item">Overview</a>
      <a className="item">Components</a>
      <a className="item">Permissions</a>
      <a className="item">Rules</a>
      <a className="item">Logs</a>
    </div>
  )
}

var Sidebar = function(props){
  return (
    <div className="ui left container">
      <SidebarServices/>
      <SidebarSections/>
    </div>
  )
}


export default Sidebar
