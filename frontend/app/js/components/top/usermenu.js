import React from 'react'
import {Link} from 'app/router'
import Restricted from 'app/restricted'
import {i18n} from 'app/utils/i18n'

function UserMenu(props){
  return (
    <div>
      <a className="item" href="#/user/profile" id="user">
        <span>{props.user.name}</span>
        <i className="ui icon user"></i>
      </a>
      <a href="#!" className="item" onClick={props.onLogout} id="logout">
        <span>{i18n("Logout")}</span>
        <i className="ui icon power"></i>
      </a>
    </div>
  )
}

export default UserMenu
