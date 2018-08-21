import React from 'react'
import {goto} from 'app/utils/store'

require('sass/sidebar.sass')

const blogo = require('imgs/logo.svg')
const powered_by_serverboards = require('imgs/logo.svg')

function goto_or_new_tab(ev, path){
  if (ev.button == 0){
    ev.preventDefault()
    goto(path)
  }
}

function Item(props){
  return (
    <a
      className={`ui ${props.selected ? "selected" : ""} item`}
      href={`#${props.goto}`}
      onClick={ (ev) => goto_or_new_tab(ev, props.goto) }
      >
      {props.label}
    </a>
  )
}

function Sidebar(props){
  const pathname = props.pathname
  return (
    <div className="ui sidebar" id="sidebar">
      <div className="ui horizontal split area with padding">
        <div className="expand">
          <img src={blogo} className="logo"/>
        </div>
        <div className="ui right align central text">
          <a href="#_" onClick={ev => {ev.preventDefault(); props.onToggleSidebar()}}>
            <i className="ui bars big icon"/>
          </a>
        </div>
      </div>
      <div className="ui padding">
        <h2 className="ui teal header">URL header</h2>
      </div>
      <div id="sections" className="ui vertical menu">
        {props.sections.project.map( s => (
          <Item key={s.id} label={s.label} selected={s.goto == pathname} goto={s.goto}/>
        ))}
      </div>
      <hr/>
      <div id="sections" className="ui vertical menu grow">
        {props.sections.global.map( s => (
          <Item key={s.id} label={s.label} selected={s.goto == pathname} goto={s.goto}/>
        ))}
      </div>

      <hr/>
      <div id="settings" className="ui vertical menu">
        <a
           className={`ui ${props.section == 'profile' ? "selected" : ""} item`}
           href="#_" style={{padding: "0 0 0 16px"}}
           onClick={(ev) => {ev.preventDefault(); goto("/user/profile")}}>
          <div className="ui horizontal split area">
            <img src={props.avatar} className="ui avatar"/>
            <div className="ui big teal text expand with padding vcentered">
              {props.user && props.user.name}
            </div>
            <div className="ui right align">
              <a href="#_" onClick={props.onLogout}>
                <i className="ui power icon big"/>
              </a>
            </div>
          </div>
        </a>

        {props.sections.settings.map( s => (
          <Item key={s.id} label={s.label} selected={s.goto == pathname} goto={s.goto}/>
        ))}
      </div>
      <div id="settings" className="ui padding">
        <img src={powered_by_serverboards}/>
      </div>
    </div>
  )
}

export default Sidebar
