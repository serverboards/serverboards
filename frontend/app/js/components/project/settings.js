import React from 'react'
import SettingsAdd from 'app/containers/project/settings_add'
import Loading from '../loading'
import HoldButton from '../holdbutton'
import i18n from 'app/utils/i18n'

class Settings extends React.Component{
  componentDidMount(){
    this.props.setSectionMenu(this.render_menu)
  }
  handleUpdate( project ){
    this.props.onUpdate( this.props.project.shortname, project )
  }
  handleDelete(){
    this.props.onDelete( this.props.project.shortname )
  }
  render_menu(){
    return (
      <div className="right menu">
        <HoldButton className="item" onHoldClick={this.handleDelete.bind(this)}>
          {i18n("Delete project")}
          <i className="ui icon trash left padding" />
        </HoldButton>
      </div>
    )
  }
  render(){
    return (
      <SettingsAdd
        title={`Edit ${this.props.project.name}`}
        project={this.props.project}
        edit={true}
        onSubmit={this.handleUpdate.bind(this)}
        >
      </SettingsAdd>
    )
  }
}

export default Settings
