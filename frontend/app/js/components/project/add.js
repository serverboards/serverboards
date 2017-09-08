import React from 'react'
import SettingsAdd from 'app/containers/project/settings_add'
import i18n from 'app/utils/i18n'
import Modal from 'app/components/modal'

function Add(props){
  return (
    <Modal>
      <SettingsAdd
        title={i18n("Add a new project")}
        onSubmit={props.onSubmit}
        edit={false}
        updateComponentCatalog={props.updateComponentCatalog}
        />
    </Modal>
  )
}

export default Add
