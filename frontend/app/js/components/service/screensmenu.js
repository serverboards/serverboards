import React from 'react'
import {merge, is_empty} from 'app/utils'
import {set_modal} from 'app/utils/store'
import {match_traits, maybe_list} from 'app/utils'
import {has_perm} from 'app/utils/perms'
import {i18n} from 'app/utils/i18n'

function by_name(a,b){
  return a.name.localeCompare( b.name )
}


function MenuItem(props){
  const candidates=props.candidates
  const has_candidates=!is_empty(candidates)

  if (props.is_open){
    return (
      <div>
        <a className={`item ${props.active ? "active" : ""}`} onClick={props.onOpen}>
          {props.children}
          {has_candidates && (
            <i className="icon caret up floating"/>
          )}
        </a>
        <div className="menu">
          {candidates.map( (s) => (
            <MenuItem
              key={s.uuid}
              section={s.uuid}
              screen={props.screen}
              data={merge(props.data, {service: s})}
              onSectionChange={props.onSectionChange}
              active={ props.active && s.uuid == props.current_service }
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
      <a className={`item ${props.active ? "active" : ""}`} onClick={handleClick}>
        {props.children}
        {has_candidates && (
          <i className="icon caret down floating"/>
        )}
        <i className={`ui icon ${props.icon}`}/>
      </a>
    )
  }
}

class ScreensMenu extends React.Component{
  constructor(props){
    super(props)

    const has_plugin_perm = has_perm("plugin")

    const screens = props.screens.filter( s => {
      if (!s.perms || s.perms.length == 0){
        // console.log(s, " as plugin perm ", has_plugin_perm)
        return has_plugin_perm
      }
      // console.log(s, " check perms ", s.perms)
      return maybe_list(s.perms).every(has_perm)
    })

    // console.log("Accepted screens: ", screens)

    this.state = {
      open_screen: undefined,
      service_id: undefined,
      screens
    }
  }
  toggleScreen(id){
    if (id == this.state.open_screen){
      this.setState({open_screen: undefined, service_id: undefined})
    }
    else{
      this.setState({open_screen: id, service_id: undefined})
    }
  }
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
  }
  render(){
    const props=this.props
    const state=this.state
    let serverboard = props.serverboard
    return (
      <div>
        {state.screens.sort(by_name).map( (s) => (
          <MenuItem
            key={s.id}
            screen={s}
            data={{serverboard}}
            candidates={props.services.filter((c) => match_traits({any: c.traits, has: s.traits}))}
            onSectionChange={this.handleSectionChange.bind(this)}
            onOpen={ () => this.toggleScreen(s.id) }
            active={ s.id == props.section }
            is_open={  (s.id == state.open_screen) }
            current_service={ state.service_id }>
              {i18n(s.name)}
          </MenuItem>
        )) }
      </div>
    )
  }
}

export default ScreensMenu
