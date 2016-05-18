import React from 'react'
import SettingsAdd from '../../containers/serverboard/settings_add'


function Add(props){
  return (
    <SettingsAdd
      title={`Add a new serverboard`}
      onSubmit={props.onSubmit}
      edit={false}
      updateComponentCatalog={props.updateComponentCatalog}
      />
  )
}

export default Add
