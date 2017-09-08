import React from 'react'
import SettingsAdd from 'app/containers/project/settings_add'
import Loading from '../loading'
import HoldButton from '../holdbutton'
import i18n from 'app/utils/i18n'

let Settings=React.createClass({
  componentDidMount(){
    this.props.setSectionMenu(this.render_menu)
  },
  handleUpdate( project ){
    this.props.onUpdate( this.props.project.shortname, project )
  },
  handleDelete(){
    this.props.onDelete( this.props.project.shortname )
  },
  render_menu(){
    return (
      <div className="right menu">
        <HoldButton className="ui item" onHoldClick={this.props.handleDelete}>{i18n("Delete project")} <i className="ui icon trash"/></HoldButton>
      </div>
    )
  },
  render(){
    return (
      <SettingsAdd
        title={`Edit ${this.props.project.name}`}
        project={this.props.project}
        edit={true}
        onSubmit={this.handleUpdate}
        >
      </SettingsAdd>
    )
  }
})

export default Settings
