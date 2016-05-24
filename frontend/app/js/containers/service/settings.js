import React from 'react'
import SettingsView from '../../components/service/settings'
import event from '../../utils/event'
import { services_update_catalog, service_update } from '../../actions/service'

var Settings = event.subscribe_connect(
  (state) => {
    return {
      service_catalog: state.serverboard.available_services
    }
  },
  (dispatch) => ({
    onUpdate: (uuid, data) => dispatch( service_update(uuid, data) )
  }),
  [],
  [services_update_catalog]
)(SettingsView)

export default Settings
