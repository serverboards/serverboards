import React from 'react'
import UserMenu from '../../containers/top/usermenu'
import {Link} from '../../router'

require("../../../sass/top.sass")

var Top = function(props){
  var menu={}
  if (props.menu == 'user'){
    console.log("Show user menu")
    menu.user=(
      <div onClick={props.toggleUserMenu} style={{position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "none"}}>
        <UserMenu/>
      </div>
    )
  }
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
          <i className="comments outline icon"></i>
          Issues
          <i className="dropdown icon"></i>
        </a>
        <a className="item disabled">
          <i className="alarm outline icon"></i>
          Notifications
          <i className="dropdown icon"></i>
        </a>
        <a className="item disabled">
          <i className="tasks icon"></i>
          Processes
          <i className="dropdown icon"></i>
        </a>
        <a className="item" onClick={props.toggleUserMenu}>
          {props.user.email}
          <i className="dropdown icon"></i>
        </a>
      </div>
      {menu.user}
    </nav>
  )
}

export default Top
