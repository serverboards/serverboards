import React from 'react'
import SettingsView from 'app/components/service/settingsmodal'
import event from 'app/utils/event'
import { services_update_catalog, service_update } from 'app/actions/service'
import { rules_save } from 'app/actions/rules'
import { set_modal } from 'app/actions/modal'

var Settings = event.subscribe_connect(
  (state) => {
    return {
      service_catalog: state.services.catalog
    }
  },
  (dispatch) => ({
    onUpdate: (uuid, data) => dispatch( service_update(uuid, data) ),
    onSaveRule: (rule) => dispatch( rules_save(rule) ),
    onClose: () => dispatch( set_modal(false) )
  }),
  [],
  [services_update_catalog]
)(SettingsView)

export default Settings
