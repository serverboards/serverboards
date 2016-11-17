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
      return "blue"
  }
  return "yellow"
}

const Top = React.createClass({
  getInitialState(){
    return {
      open_time: undefined
    }
  },
  componentDidMount(){
    $(this.refs.notifications_item).popup({
      popup: $(this.refs.el).find('#notifications_menu'),
      on: 'hover',
      hoverable: true,
      position: 'bottom center',
      delay: {
        show: 100,
        hide: 300
      },
      onVisible: () => this.setState({open_time: new Date()})
    })
  },
  render(){
    const props=this.props
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
        <div onClick={props.closeMenu} style={{position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "none"}}>
          {menu}
        </div>
      )
    let logo=require("../../../imgs/white-horizontal-logo.svg")
    const gravatar_url=gravatar.url(props.user.email, {s: 32})

    return (
      <nav className="ui top fixed menu" ref="el">
        <div className="item logo">
          <a href="#/">
            <img src={logo}/>
          </a>
        </div>

        <div className="right menu">
          <div className="item search">
            <CommandSearh/>
          </div>
          <a className="item" ref="notifications_item">
            <i className="announcement icon"></i>
            {((props.notifications||[]).length > 0) ? (
              <span
                className={`ui micro label floating circular ${notifications_color(props.notifications)}`}
                style={{top: 8, left: 43}}
                />
              ) : null}
          </a>
          <NotificationsMenu open_time={this.state.open_time}/>
          <a className="item" onClick={() => props.toggleMenu('processes')}>
            <i className={`spinner ${props.actions.length==0 ? "" : "loading"} icon`}/>
          </a>
          <a className="item" onClick={() => props.toggleMenu('user')}>
          <img src={gravatar_url} className="ui circular image small" style={{width: 32, height: 32}}
            data-tooltip={props.user.email}/>
          </a>
        </div>
        {menu}
      </nav>
    )
  }
})

export default Top
