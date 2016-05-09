import React from 'react'
import { connect } from 'react-redux'
import SettingsView from '../../components/service/settings'
import { service_delete, service_update, service_reload_components, components_update_catalog } from '../../actions/service'

var Settings=connect(
  (state) => {
    return {
      available_components: state.service.available_components,
      current_components: state.service.current_components
    }
  },
  (dispatch) => ({
    onUpdate: (shortname, changes) => dispatch( service_update(shortname, changes) ),
    onDelete: (shortname) => dispatch( service_delete(shortname) ),
    refreshComponents: (shortname) => dispatch( service_reload_components(shortname) ),
    updateComponentCatalog: () => dispatch( components_update_catalog() )
  })
)(SettingsView)

export default Settings
