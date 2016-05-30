import React from 'react'
import SettingsAdd from '../../containers/serverboard/settings_add'
import Loading from '../loading'

let Settings=React.createClass({
  handleUpdate : function( serverboard ){
    this.props.onUpdate( this.props.serverboard.shortname, serverboard )
  },
  handleDelete : function(){
    this.props.onDelete( this.props.serverboard.shortname )
  },
  render: function(){
    return (
      <SettingsAdd
        title={`Edit ${this.props.serverboard.name}`}
        serverboard={this.props.serverboard}
        edit={true}
        onSubmit={this.handleUpdate}
        onDelete={this.handleDelete}
        />
    )
  }
})

export default Settings
