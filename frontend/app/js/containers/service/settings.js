import React from 'react'
import SettingsView from 'app/components/service/settings'
import { services_update_catalog, service_update } from 'app/actions/service'
import { rules_save } from 'app/actions/rules'
import { set_modal } from 'app/actions/modal'
import connect from 'app/containers/connect'

var Settings = connect({
  state: (state) => {
    return {
      service_catalog: state.services.catalog
    }
  },
  handlers: (dispatch) => ({
    onUpdate: (uuid, data) => dispatch( service_update(uuid, data) ),
    onSaveRule: (rule) => dispatch( rules_save(rule) ),
    onClose: () => dispatch( set_modal(false) )
  }),
  store_enter: [services_update_catalog]
})(SettingsView)

export default Settings
