import React from 'react'
import SettingsAdd from '../../containers/service/settings_add'
import Loading from '../loading'
import {default_component_fields} from './settings_add'

let Settings=React.createClass({
  initialComponents : function(){
    if (this.props.current_components){
      let components = this.props.current_components.map( (c) =>{
        let componentbase = this.props.available_components.find((cb) => cb.type == c.type )
        let fields = default_component_fields(componentbase.name)
        fields = $.extend(true, [], fields.concat( componentbase.fields )) // dup
        for (let f of fields){
          f.value=c.config[f.name]
        }

        return {
          uuid: c.uuid,
          type: c.type,
          fields : fields,
          name: c.name
        }
      })
      console.log("Set components: %o", components)
      return components
    }
    console.log("No components")
    return []
  },
  handleUpdate : function( service ){
    this.props.onUpdate( this.props.service.shortname, service )
  },
  handleDelete : function(){
    this.props.onDelete( this.props.service.shortname )
  },
  componentDidMount : function(){
    if (!this.props.current_components){
      console.log("Refresh components")
      this.props.refreshComponents( this.props.service.shortname )
    }
    if (!this.props.available_components){
      console.log("Refresh component catalog")
      this.props.updateComponentCatalog()
    }
  },
  render: function(){
    // Show loading until all data is ready to show.
    if (!this.props.current_components || !this.props.available_components){
      return (
        <Loading>
          Getting components at {this.props.service.name}
        </Loading>
      )
    }

    let initial_components=this.initialComponents()

    return (
      <SettingsAdd
        service={this.props.service}
        edit={true}
        onSubmit={this.handleUpdate}
        onDelete={this.handleDelete}
        initial_components={initial_components}
        updateComponentCatalog={this.props.updateComponentCatalog}
        />
    )
  }
})

export default Settings
