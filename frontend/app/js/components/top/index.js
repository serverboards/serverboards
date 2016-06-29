import React from 'react'
import UserMenu from 'app/containers/top/usermenu'
import ProcessesMenu from 'app/containers/top/processesmenu'
import {Link} from 'app/router'

require("sass/top.sass")

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
        <div className="ui search">
          <div className="ui icon input">
            <input className="prompt" type="text" placeholder="Search anything..."/>
            <i className="search icon"></i>
          </div>
          <div className="results"></div>
        </div>
      </div>

      <div className="right menu">
        <a className="item disabled">
          <i className="lightning icon"></i>
          Issues
          <i className="dropdown icon"></i>
        </a>
        <a className="item disabled">
          <i className="alarm outline icon"></i>
          Notifications
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
