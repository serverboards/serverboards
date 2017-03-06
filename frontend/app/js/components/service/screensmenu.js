import React from 'react'
import {merge, is_empty} from 'app/utils'
import {set_modal} from 'app/utils/store'
import {match_traits} from './utils'
import {i18n} from 'app/utils/i18n'

function by_name(a,b){
  return a.name.localeCompare( b.name )
}


function MenuItem(props){
  const candidates=props.candidates
  const has_candidates=!is_empty(candidates)

  if (props.is_open && has_candidates){
    return (
      <div>
        <a className="item" onClick={props.onOpen}>
          {props.children}
          <i className="icon caret down floating"/>
        </a>
        <div className="menu">
          {candidates.map( (s) => (
            <MenuItem
              key={s.uuid}
              section={s.uuid}
              screen={props.screen}
              data={merge(props.data, {service: s})}
              onSectionChange={props.onSectionChange}
              is_open={ s.uuid == props.subopen }
              >
              {s.name}
            </MenuItem>
          ))}
        </div>
      </div>
    )
  }
  else {
    const handleClick=(has_candidates ?
      props.onOpen :
      ( () => props.onSectionChange(props.screen.id, props.data) )
    )

    return (
      <a className={`item ${props.is_open ? "active" : ""}`} onClick={handleClick}>
        {props.children}
        {has_candidates ? (
          <i className="icon caret right floating right"/>
        ) :
        (
          null
        )}
        <i className={`ui icon ${props.icon}`}/>
      </a>
    )
  }
}

const ScreensMenu=React.createClass({
  getInitialState(){
    return {
      open_screen: undefined,
      service_id: undefined
    }
  },
  toggleScreen(id){
    if (id == this.state.open_screen){
      this.setState({open_screen: undefined, service_id: undefined})
    }
    else{
      this.setState({open_screen: id, service_id: undefined})
    }
  },
  handleSectionChange(screen_id, data){
    this.setState({open_screen: screen_id, service_id: data.service && data.service.uuid})
    if (this.props.onSectionChange){
      this.props.onSectionChange(screen_id, data)
    }
    else{
      const screen_idl=screen_id.split('/')
      const plugin=screen_idl[0]
      const component=screen_idl[1]
      set_modal("plugin.screen", {plugin: plugin, component: component, data:{service: data.service}})
    }
  },
  render(){
    const props=this.props
    const state=this.state
    let screens=[]
    let open_item = state.open_screen
    let serverboard = props.serverboard
    return (
      <div>
        {props.screens.sort(by_name).map( (s) => (
          <MenuItem
            key={s.id}
            screen={s}
            data={{serverboard}}
            candidates={props.services.filter((c) => match_traits(c.traits, s.traits))}
            onSectionChange={this.handleSectionChange}
            onOpen={ () => this.toggleScreen(s.id) }
            is_open={ s.id == state.open_screen }
            subopen={  (s.id == state.open_screen) && state.service_id }>
              {i18n(s.name)}
          </MenuItem>
        )) }
      </div>
    )
  }
})

export default ScreensMenu
