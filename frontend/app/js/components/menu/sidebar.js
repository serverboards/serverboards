import React from 'react'
import {goto} from 'app/utils/store'
import Restricted from 'app/restricted'
import {ErrorBoundary} from 'app/components/error'
import Hook from 'app/containers/hooks'

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
    <Restricted perm={props.perm}>
      <a
        className={`ui ${props.selected ? "selected" : ""} item`}
        href={`#${props.goto}`}
        onClick={ (ev) => goto_or_new_tab(ev, props.goto) }
        >
        {props.label}
      </a>
    </Restricted>
  )
}

function Sidebar(props){
  const pathname = props.pathname
  return (
    <div className="ui sidebar" id="sidebar">
      <div className="ui horizontal split area" id="logo-area">
        <div className="ui central text" id="hamburguer">
          <a href="#_" onClick={ev => {ev.preventDefault(); props.onToggleSidebar()}}>
            <i className="ui bars big icon"/>
          </a>
        </div>
        <div className="expand" id="logo">
          <a href="#/" onClick={ev => goto_or_new_tab(ev, '/')} className="ui right aligned">
            <img src={blogo}/>
          </a>
        </div>
      </div>
      <a className="ui item" href="#_" onClick={(ev) => { ev.preventDefault(); props.onToggleProjectSelector()}}>
        <div className="ui padding horizontal split area" id="projectname">
          <h2 className="ui teal header">{props.project}</h2>
          <i className="ui expand angle right aligned icon"/>
        </div>
      </a>
      <Hook name="sidebar.top"/>

      <div className="ui expand scroll">
        <div className="ui vertical split area">
          {props.sections.project.map( s => (
            <Item key={s.id} label={s.label} selected={s.goto == pathname} goto={s.goto} perm={s.perm}/>
          ))}
        </div>
        <hr/>
        <div className="ui vertical split area grow">
          {props.sections.global.map( s => (
            <Item key={s.id} label={s.label} selected={s.goto == pathname} goto={s.goto} perm={s.perm}/>
          ))}
        </div>
        <Hook name="sidebar.middle"/>

        <hr/>
        <div className="ui vertical split area">
          <div className="ui horizontal split area" style={{width: "100%", maxWidth: "100%"}}>
            <a
               className={`ui grow ${props.section == 'profile' ? "selected" : ""} item`}
               href="#_" style={{padding: "0 0 0 16px"}}
               onClick={(ev) => {ev.preventDefault(); goto("/user/profile")}}>
              <div className="ui horizontal split area">
                <img src={props.avatar} className="ui avatar"/>
                <div className="ui big teal text expand with padding vcentered oneline">
                  {props.user && props.user.name}
                </div>
              </div>
            </a>
            <a href="#_" onClick={props.onLogout} className="ui right align full item no border">
              <i className="ui power icon big"/>
            </a>
          </div>

          {props.sections.settings.map( s => (
            <Item key={s.id} label={s.label} selected={s.goto == pathname} goto={s.goto} perm={s.perm}/>
          ))}
        </div>
      </div>
      <Hook name="sidebar.bottom"/>
    </div>
  )
}

export default Sidebar