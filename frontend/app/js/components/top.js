import React from 'react'

var Top = function(props){
  return (
    <nav className="ui top fixed menu">
      <div className="item">
        Serverboards
      </div>
      <div className="item">
        {props.email}
      </div>
      <a href="#!" className="item right" onClick={props.onLogout}>
        Logout
      </a>
    </nav>
  )
}

export default Top
