import React from 'react'
import {merge} from 'app/utils'

function by_name(a,b){
  return a.name.localeCompare( b.name )
}

function MenuItem(props){
  console.log(props)
  if (props.is_open){
    return (
      <div>
        <a className="item active" onClick={props.onOpen}>
          {props.children}
          <i className="icon angle right floating right"/>
        </a>
        {props.candidates.map( (s) => (
          <MenuItem
            section={s.id}
            data={merge(props.data, {service: s})}
            onSectionChange={props.onSectionChange}
            >
            {s.name}
          </MenuItem>
        ))}
      </div>
    )
  }
  else {
    return (
      <a className="item" onClick={() => props.onSectionChange(props.section, props.data)}>
        {props.children}
        {(props.candidates && (props.candidates.length > 0)) ? (
          <i className={`icon ${props.icon}`}/>
        ) :
        (
          []
        )}
      </a>
    )
  }
}

const ScreensMenu=React.createClass({
  getInitialState(){
    return {
      open_screen: undefined
    }
  },
  toggleScreen(id){
    if (id == this.state.open_screen){
      this.setState({open_screen: undefined})
    }
    else{
      this.setState({open_screen: id})
    }
  },
  render(){
    const props=this.props
    const state=this.state
    let screens=[]
    let open_item = undefined
    let serverboard = props.serverboard
    return (
      <div>
        {props.screens.sort(by_name).map( (s) => (
          <MenuItem
            screen={s}
            data={{serverboard}}
            candidates={props.services}
            onSectionChange={props.onSectionChange}
            onOpen={ () => this.toggleScreen(s.id) }
            is_open={ s.id == props.current }>
              {s.name}
          </MenuItem>
        )) }
      </div>
    )
  }
})

export default ScreensMenu
