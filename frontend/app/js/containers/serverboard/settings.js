import React from 'react'
import { connect } from 'react-redux'
import SettingsView from '../../components/serverboard/settings'
import { serverboard_delete, serverboard_update, serverboard_reload_services, services_update_catalog } from '../../actions/serverboard'

var Settings=connect(
  (state) => {
    return {
      available_services: state.serverboard.available_services,
      current_services: state.serverboard.current_services
    }
  },
  (dispatch) => ({
    onUpdate: (shortname, changes) => dispatch( serverboard_update(shortname, changes) ),
    onDelete: (shortname) => dispatch( serverboard_delete(shortname) ),
    refreshComponents: (shortname) => dispatch( serverboard_reload_services(shortname) ),
    updateComponentCatalog: () => dispatch( services_update_catalog() )
  })
)(SettingsView)

export default Settings
