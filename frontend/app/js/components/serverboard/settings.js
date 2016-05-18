import React from 'react'
import SettingsAdd from '../../containers/serverboard/settings_add'
import Loading from '../loading'
import {default_service_fields} from './settings_add'

let Settings=React.createClass({
  initialComponents : function(){
    if (this.props.current_services){
      let services = this.props.current_services.map( (c) =>{
        let servicebase = this.props.available_services.find((cb) => cb.type == c.type )
        let fields = default_service_fields(servicebase.name)
        fields = $.extend(true, [], fields.concat( servicebase.fields )) // dup
        c.config.name=c.name
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
      return services
    }
    return []
  },
  handleUpdate : function( serverboard ){
    this.props.onUpdate( this.props.serverboard.shortname, serverboard )
  },
  handleDelete : function(){
    this.props.onDelete( this.props.serverboard.shortname )
  },
  componentDidMount : function(){
    if (!this.props.current_services){
      console.log("Refresh services")
      this.props.refreshComponents( this.props.serverboard.shortname )
    }
    if (!this.props.available_services){
      console.log("Refresh service catalog")
      this.props.updateComponentCatalog()
    }
  },
  render: function(){
    // Show loading until all data is ready to show.
    if (!this.props.current_services || !this.props.available_services){
      return (
        <Loading>
          Getting services at {this.props.serverboard.name}
        </Loading>
      )
    }

    let initial_services=this.initialComponents()

    return (
      <SettingsAdd
        title={`Edit ${this.props.serverboard.name}`}
        serverboard={this.props.serverboard}
        edit={true}
        onSubmit={this.handleUpdate}
        onDelete={this.handleDelete}
        initial_services={initial_services}
        updateComponentCatalog={this.props.updateComponentCatalog}
        />
    )
  }
})

export default Settings
