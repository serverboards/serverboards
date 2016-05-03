import React from 'react';
import {Link} from '../router'

function logo(name){
  return name.slice(0,2).toUpperCase()
}

var Sidebar = function(props){

  var service = function(service){
    let klass="item "
    if (props.current == service.shortname)
      klass+="active"
    return (
      <a key={service.shortname} className={klass} title={service.name} onClick={() => props.onServiceSelect(service.shortname)}>
        <span className="logo">{logo(service.name)}</span>
        {service.shortname}
      </a>
    )
  }

  return (
    <div className="ui left container vertical labeled icon menu services">
      {props.services.map(service)}
    </div>
  )
}

export default Sidebar
