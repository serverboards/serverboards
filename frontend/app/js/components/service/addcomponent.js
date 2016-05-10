import React from 'react'
import LogoIcon from '../logoicon'
import Loading from '../loading'
import Modal from '../modal'
import {default_component_fields} from './settings_add'

require("../../../sass/modal.sass")


let AddComponent=React.createClass({
  componentDidMount : function(){
    if (!this.props.available_components){
      this.props.updateComponentCatalog()
    }
  },
  handleAdd : function(ev, component_type){
    ev.preventDefault(ev)

    let current_component=Object.assign({}, this.props.available_components.find((c) => c.type == component_type))

    console.log(this.props.available_components)
    console.log(current_component)

    current_component.fields=$.extend(true, [], default_component_fields(current_component.name).concat( current_component.fields ) )
    current_component.id=undefined

    this.props.onAdd( current_component )
  },
  render(){
    let props=this.props
    if (!this.props.available_components){
      return (
        <Loading>
          Getting available component list
        </Loading>
      )
    }


    console.log(props)
    let self=this

    function WrappedComponent(props){
      return (
        <a key={props.type} className="column center aligned" onClick={(ev) => self.handleAdd(ev, props.type)} href="#">
          <LogoIcon name={props.name} style={{margin: 'auto'}}/>
          {props.name}
        </a>
      )
    }

    return (
      <Modal onClose={props.onClose}>
        <div className="header">
          Select a component to add
        </div>
        <div className="content">
          <div className="ui five column grid">
            {props.available_components.map((c) => WrappedComponent(c))}
          </div>
        </div>
        <div className="actions">
          <div className="ui cancel button" onClick={props.onClose}>Cancel</div>
        </div>
      </Modal>
    )
  }
})

export default AddComponent
