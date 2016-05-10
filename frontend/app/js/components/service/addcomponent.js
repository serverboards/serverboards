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
    if (!this.props.all_components){
      this.props.updateAllComponentCatalog()
    }
  },
  handleAdd : function(ev, component){
    ev.preventDefault(ev)

    if (component.uuid){
      // Component is a plain components, need to have the fields field
      let current_component=Object.assign({}, this.props.available_components.find((c) => c.type == component.type))
      current_component.fields=$.extend(true, [], default_component_fields(current_component.name).concat( current_component.fields ) )
      // set fields values
      current_component.uuid=component.uuid
      current_component.name=component.name
      component.config.name=component.name
      component.config.description=component.description
      current_component.fields.map( (f) => {
        f.value=component.config[f.name]
      })

      this.props.onAttach( current_component )
    }
    else{
      let current_component=Object.assign({}, this.props.available_components.find((c) => c.type == component.type))

      current_component.fields=$.extend(true, [], default_component_fields(current_component.name).concat( current_component.fields ) )
      current_component.id=undefined

      this.props.onAdd( current_component )
    }
  },
  render(){
    let props=this.props
    if (!this.props.available_components || !this.props.all_components){
      return (
        <Loading>
          Getting available component list
        </Loading>
      )
    }


    let self=this

    function WrappedComponent(props){
      return (
        <a key={props.uuid || props.type} className="column center aligned" onClick={(ev) => self.handleAdd(ev, props)} href="#">
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
          <label>Existing components</label>
          <div className="ui five column grid stackable">
            {props.all_components.map((c) => WrappedComponent(c))}
          </div>
          <label>New components</label>
          <div className="ui five column grid stackable">
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
