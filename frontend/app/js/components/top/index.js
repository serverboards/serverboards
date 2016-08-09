import React from 'react'
import UserMenu from 'app/containers/top/usermenu'
import ProcessesMenu from 'app/containers/top/processesmenu'
import NotificationsMenu from 'app/containers/top/notificationsmenu'
import {Link} from 'app/router'
import CommandSearh from './commands'

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
        <a className="item" onClick={() => props.toggleMenu('notifications')}>
          <i className="alarm outline icon"></i>
          Notifications
          <span className={`ui label ${notifications_color(props.notifications)}`}>{(props.notifications || []).length}</span>
          <i className="dropdown icon"></i>
        </a>
        <a className="item" onClick={() => props.toggleMenu('processes')}>
          <i className="spinner icon"></i>
          Processes
          <span className={`ui label ${props.actions.length==0 ? "" : "teal"}`}>{props.actions.length}</span>
          <i className="dropdown icon"></i>
        </a>
        <a className="item" onClick={() => props.toggleMenu('user')}>
          {props.user.email}
          <i className="dropdown icon"></i>
        </a>
      </div>
      {menu}
    </nav>
  )
}

export default Top
