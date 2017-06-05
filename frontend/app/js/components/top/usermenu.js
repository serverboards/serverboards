import React from 'react'
import {Link} from 'app/router'
import Restricted from 'app/restricted'
import {i18n} from 'app/utils/i18n'

function UserMenu(props){
  return (
    <div className="ui dropdown pointing" id="profile_menu">
      <div className="menu transition visible">
        <a className="item" href="#/user/profile" id="user">
          <span>{props.user.name}</span>
          <i className="ui icon user"></i>
        </a>
        <a className="item" href="#/settings/" id="settings">
          <span>{i18n("Settings")}</span>
          <i className="ui icon settings"></i>
        </a>
        <Restricted perm="logs.view">
          <a className="item" href="#/logs/" id="logs">
              <span>{i18n("Logs")}</span>
              <i className="ui icon book"></i>
          </a>
        </Restricted>
        <a href="#!" className="item" onClick={props.onLogout} id="logout">
          <span>{i18n("Logout")}</span>
          <i className="ui icon power"></i>
        </a>
      </div>
    </div>
  )
}

export default UserMenu
