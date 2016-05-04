import React from 'react';
import {Link} from '../router'
import LogoIcon from './logoicon'

var Sidebar = function(props){

  var service = function(service){
    let klass="item "
    if (props.current == service.shortname)
      klass+="active"
    return (
      <a key={service.shortname} className={klass} title={service.name} onClick={() => props.onServiceSelect(service.shortname)}>
        <LogoIcon name={service.shortname}/>
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
