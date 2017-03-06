import React from 'react'
import SettingsAdd from 'app/containers/project/settings_add'
import i18n from 'app/utils/i18n'


function Add(props){
  return (
    <SettingsAdd
      title={i18n("Add a new project")}
      onSubmit={props.onSubmit}
      edit={false}
      updateComponentCatalog={props.updateComponentCatalog}
      />
  )
}

export default Add
