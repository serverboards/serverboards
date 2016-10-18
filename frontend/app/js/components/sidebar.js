import React from 'react';
import {Link} from 'app/router'
import LogoIcon from './logoicon'

var Sidebar = function(props){

  var serverboard = function(serverboard){
    let klass="item "
    if (props.current == serverboard.shortname)
      klass+="active"
    return (
      <div key={serverboard.shortname} data-tooltip={`${serverboard.name}: ${serverboard.description}`} data-position="right center">
        <a key={serverboard.shortname} className={klass} onClick={() => props.onServiceSelect(serverboard.shortname)}>
          <LogoIcon name={serverboard.shortname} color="slim"/>
          {serverboard.shortname}
        </a>
      </div>
    )
  }

  return (
    <div className="ui left container vertical labeled icon menu serverboards sidebar">
      {props.serverboards.map(serverboard)}
    </div>
  )
}

export default Sidebar
