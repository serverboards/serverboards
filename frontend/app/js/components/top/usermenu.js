import React from 'react'
import {Link} from '../../router'

function UserMenu(props){
  return (
    <div className="ui dropdown vertical menu" style={{position: "fixed", right: 0, top: "40px"}}>
      <a className="item" href="#/user/profile">
          {props.user.first_name} {props.user.last_name}
        <i className="ui icon right user"></i>
      </a>
      <a className="item" href="#/settings/">
          Settings
        <i className="ui icon right settings"></i>
      </a>
      <a href="#!" className="item" onClick={props.onLogout}>
        Logout
      </a>
    </div>
  )
}

export default UserMenu
