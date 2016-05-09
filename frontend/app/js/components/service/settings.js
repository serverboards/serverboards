import React from 'react'
import SettingsAdd from '../../containers/service/settings_add'
import Loading from '../loading'
import {default_component_fields} from './settings_add'

let Settings=React.createClass({
  handleUpdate : function( service ){
    this.props.onUpdate( this.props.service.shortname, service )
  },
  handleDelete : function(){
    this.props.onDelete( this.props.service.shortname )
  },
  componentDidMount : function(){
    if (this.props.current_components == undefined){
      this.props.refreshComponents( this.props.service.shortname )
    }
    if (this.props.available_components == undefined){
      this.props.updateComponentCatalog()
    }
  },
  render: function(){
    // This is a hack because just changing a property does not work in react (maybe bug?)
    // Anyway, shows loading fr a sec, when data ready shows it all.
    if (this.props.current_components == undefined || this.props.available_components == undefined )
      return (
        <Loading/>
      )

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

    return (
      <SettingsAdd
        service={this.props.service}
        edit={true}
        onSubmit={this.handleUpdate}
        onDelete={this.handleDelete}
        initial_components={components}
        updateComponentCatalog={this.props.updateComponentCatalog}
        />
    )
  }
})

export default Settings
