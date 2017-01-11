import React from 'react'
import { connect } from 'react-redux'
import SettingsView from 'app/components/serverboard/settings'
import { serverboard_delete, serverboard_update, serverboard_reload_services } from 'app/actions/serverboard'
import { services_update_catalog, services_update_all } from 'app/actions/service'

var Settings=connect(
  (state) => {
    return {
      //catalog: state.services.catalog,
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
