import React from 'react'
import SettingsAdd from '../../containers/service/settings_add'


function Add(props){
  return (
    <SettingsAdd
      title={`Add a new service`}
      onSubmit={props.onSubmit}
      edit={false}
      updateComponentCatalog={props.updateComponentCatalog}
      />
  )
}

export default Add
