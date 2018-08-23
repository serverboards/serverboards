import React from 'react'
import {goto} from 'app/utils/store'
import Restricted from 'app/restricted'
import ProjectSelector from 'app/containers/menu/projectselector'
import {ErrorBoundary} from 'app/components/error'

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
    <Restricted perm={props.perms || ""}>
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
    <React.Fragment>
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
      <div className="ui padding horizontal split area" id="projectname">
        <h2 className="ui teal header">{props.project}</h2>
        <div className="expand">
          <a href="#_" onClick={(ev) => { ev.preventDefault(); props.onToggleProjectSelector()}} className="ui right aligned item no border">
            <i className="ui angle right icon"/>
          </a>
        </div>
      </div>

      <div className="ui expand scroll">
        <div className="ui vertical split area">
          {props.sections.project.map( s => (
            <Item key={s.id} label={s.label} selected={s.goto == pathname} goto={s.goto}/>
          ))}
        </div>
        <hr/>
        <div className="ui vertical split area grow">
          {props.sections.global.map( s => (
            <Item key={s.id} label={s.label} selected={s.goto == pathname} goto={s.goto}/>
          ))}
        </div>

        <hr/>
        <div className="ui vertical split area">
          <div className="ui horizontal split area ">
            <a
               className={`ui ${props.section == 'profile' ? "selected" : ""} item`}
               href="#_" style={{padding: "0 0 0 16px"}}
               onClick={(ev) => {ev.preventDefault(); goto("/user/profile")}}>
              <div className="ui horizontal split area">
                <img src={props.avatar} className="ui avatar"/>
                <div className="ui big teal text expand with padding vcentered oneline">
                  {props.user && props.user.name}
                </div>
              </div>
            </a>
            <div className="ui right align item no border">
              <a href="#_" onClick={props.onLogout}>
                <i className="ui power icon big"/>
              </a>
            </div>
          </div>

          {props.sections.settings.map( s => (
            <Item key={s.id} label={s.label} selected={s.goto == pathname} goto={s.goto}/>
          ))}
        </div>
      </div>
      <div className="ui padding">
        <img src={powered_by_serverboards}/>
      </div>
    </div>
    {props.project_selector && (
      <ProjectSelector/>
    )}
    </React.Fragment>
  )
}

export default Sidebar
