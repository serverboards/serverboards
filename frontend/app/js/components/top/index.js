import React from 'react'
import UserMenu from '../../containers/top/usermenu'
import {Link} from '../../router'

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
      <div className="item" style={{padding: 0}}>
        <a href="#/">
          <img src={logo} style={{height: 40}}/>
        </a>
      </div>
      <a className="item right" onClick={props.toggleUserMenu}>
        {props.user.email}
        <i class="dropdown icon"></i>
      </a>
      {menu.user}
    </nav>
  )
}

export default Top
