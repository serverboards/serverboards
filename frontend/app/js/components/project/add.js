import React from 'react'
import SettingsAdd from 'app/containers/project/settings_add'


function Add(props){
  return (
    <SettingsAdd
      title={`Add a new project`}
      onSubmit={props.onSubmit}
      edit={false}
      updateComponentCatalog={props.updateComponentCatalog}
      />
  )
}

export default Add
