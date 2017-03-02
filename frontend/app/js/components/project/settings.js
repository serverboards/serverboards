import React from 'react'
import SettingsAdd from 'app/containers/project/settings_add'
import Loading from '../loading'

let Settings=React.createClass({
  handleUpdate( project ){
    this.props.onUpdate( this.props.project.shortname, project )
  },
  handleDelete(){
    this.props.onDelete( this.props.project.shortname )
  },
  render(){
    return (
      <SettingsAdd
        title={`Edit ${this.props.project.name}`}
        project={this.props.project}
        edit={true}
        onSubmit={this.handleUpdate}
        onDelete={this.handleDelete}
        >
        <div className="ui fixed bottom">
          <a href={`#/project/${this.props.project.shortname}/services`}
          className="ui header medium link">
          Configure services for this project <i className="ui icon angle right"/>
          </a>
        </div>
      </SettingsAdd>
    )
  }
})

export default Settings
