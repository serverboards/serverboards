import React from 'react'
import UserMenu from 'app/containers/top/usermenu'
import ProcessesMenu from 'app/containers/top/processesmenu'
import NotificationsMenu from 'app/containers/top/notificationsmenu'
import {Link} from 'app/router'
import CommandSearh from './commands'
import gravatar from 'gravatar'

require("sass/top.sass")

function notifications_color(notifications){
  if (!notifications || notifications.length==0)
    return ""
  for(let n of notifications){
    if (n.tags.indexOf("new")>=0)
      return "green"
  }
  return "yellow"
}

var Top = function(props){
  let menu=undefined
  switch (props.menu){
    case 'user':
      menu=(
        <UserMenu/>
      )
      break;
    case 'processes':
      menu=(
        <ProcessesMenu/>
      )
      break;
    case 'notifications':
      menu=(
        <NotificationsMenu/>
      )
      break;
  }
  if (menu)
    menu=(
      <div onClick={props.closeMenu} style={{position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "none"}}>
        {menu}
      </div>
    )
  let logo=require("../../../imgs/logo.svg")
  const gravatar_url=gravatar.url(props.user.email, {s: 32})

  return (
    <nav className="ui top fixed menu">
      <div className="item logo">
        <a href="#/">
          <img src={logo}/>
        </a>
      </div>
      <div className="item search">
        <CommandSearh/>
      </div>

      <div className="right menu">
        <a className="item" onClick={() => props.toggleMenu('notifications')}
          data-tooltip="Notifications">
          <i className="announcement icon"></i>
          <span
            className={`ui mini label floating circular ${notifications_color(props.notifications)}`}
            style={{top: 3, left: 43}}
            >{(props.notifications || []).length}</span>
        </a>
        <a className="item" onClick={() => props.toggleMenu('processes')}>
          <i className={`spinner ${props.actions.length==0 ? "" : "loading"} icon`}/>
          <span
            className={`ui mini label floating circular ${props.actions.length==0 ? "" : "teal"}`}
            style={{top: 3, left: 43}}
            >{props.actions.length}</span>
          <i className="dropdown icon"></i>
        </a>
        <a className="item" onClick={() => props.toggleMenu('user')}>
        <img src={gravatar_url} className="ui circular image small" style={{width: 32, height: 32}}
          data-tooltip={props.user.email}/>
          <i className="dropdown icon"></i>
        </a>
      </div>
      {menu}
    </nav>
  )
}

export default Top
