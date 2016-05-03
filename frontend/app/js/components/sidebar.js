import React from 'react';
import {Link} from '../router'

require("../../sass/sidebar.sass")

function logo(name){
  return name.slice(0,2).toUpperCase()
}

var SidebarServices = function(props){

  var service = function(service){
    return (
      <Link className="item" title={service.name} to="/service/{{service.shortname}}/">
        <span className="logo">{logo(service.name)}</span>
        {service.shortname}
      </Link>
    )
  }

  return (
    <div className="ui vertical labeled icon menu services">
      {props.services.map(service)}
    </div>
  )
}

var SidebarSections = function(props){
  return (
    <div className="ui vertical menu sections">
      <h3 className="ui item header">{props.name}</h3>
      <Link className="item" to={`/service/${props.shortname}/overview`}>Overview</Link>
      <Link className="item" to={`/service/${props.shortname}/components`}>Components</Link>
      <Link className="item" to={`/service/${props.shortname}/permissions`}>Permissions</Link>
      <Link className="item" to={`/service/${props.shortname}/rules`}>Rules</Link>
      <Link className="item" to={`/service/${props.shortname}/logs`}>Logs</Link>
    </div>
  )
}

var Sidebar = function(props){
  var props={
    services: [
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
    ],
    current:"SBDS"
  }


  var current_section=props.services.find( (el) => (el.shortname == props.current) )
  return (
    <div className="ui left container">
      <SidebarServices {...props}/>
      <SidebarSections {...current_section}/>
    </div>
  )
}


export default Sidebar
