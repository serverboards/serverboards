import React from 'react'
import SettingsAdd from 'app/containers/serverboard/settings_add'
import Loading from '../loading'

let Settings=React.createClass({
  handleUpdate( serverboard ){
    this.props.onUpdate( this.props.serverboard.shortname, serverboard )
  },
  handleDelete(){
    this.props.onDelete( this.props.serverboard.shortname )
  },
  render(){
    return (
      <SettingsAdd
        title={`Edit ${this.props.serverboard.name}`}
        serverboard={this.props.serverboard}
        edit={true}
        onSubmit={this.handleUpdate}
        onDelete={this.handleDelete}
        >
        <div className="ui fixed bottom">
          <a href={`#/serverboard/${this.props.serverboard.shortname}/services`}
          className="ui header medium link">
          Configure services for this serverboard <i className="ui icon angle right"/>
          </a>
        </div>
      </SettingsAdd>
    )
  }
})

export default Settings
