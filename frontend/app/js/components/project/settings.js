import React from 'react'
import SettingsAdd from 'app/containers/project/settings_add'
import Loading from '../loading'
import HoldButton from '../holdbutton'
import i18n from 'app/utils/i18n'
import {SectionMenu} from 'app/components'

function SettingsMenu(props){
  return (
    <div className="right menu">
      <HoldButton className="item" onHoldClick={props.onDelete}>
        {i18n("Delete project")}
        <i className="ui icon trash left padding" />
      </HoldButton>
    </div>
  )
}


class Settings extends React.Component{
  handleUpdate( project ){
    this.props.onUpdate( this.props.project.shortname, project )
  }
  handleDelete(){
    this.props.onDelete( this.props.project.shortname )
  }
  render(){
    return (
      <React.Fragment>
        <SectionMenu menu={SettingsMenu} onDelete={this.handleDelete.bind(this)}/>
        <SettingsAdd
          title={`Edit ${this.props.project.name}`}
          project={this.props.project}
          edit={true}
          onSubmit={this.handleUpdate.bind(this)}
          />
      </React.Fragment>
    )
  }
}

export default Settings
