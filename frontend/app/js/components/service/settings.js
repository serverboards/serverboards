import React from 'react'
import SettingsAdd from '../../containers/service/settings_add'


let Settings=React.createClass({
  handleUpdate : function( service ){
    this.props.onUpdate( this.props.service.shortname, service )
  },
  handleDelete : function(){
    this.props.onDelete( this.props.service.shortname )
  },
  render: function(){
    return (
      <SettingsAdd
        service={this.props.service}
        edit={true}
        onSubmit={this.handleUpdate}
        onDelete={this.handleDelete}
        updateComponentCatalog={this.props.updateComponentCatalog}
        />
    )
  }
})

export default Settings
