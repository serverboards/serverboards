import React from 'react'
import { connect } from 'react-redux'
import SettingsView from 'app/components/project/settings'
import { project_delete, project_update, project_reload_services } from 'app/actions/project'
import { services_update_catalog, services_update_all } from 'app/actions/service'

var Settings=connect(
  (state) => {
    return {
      //catalog: state.services.catalog,
      current_services: state.project.current_services
    }
  },
  (dispatch) => ({
    onUpdate: (shortname, changes) => dispatch( project_update(shortname, changes) ),
    onDelete: (shortname) => dispatch( project_delete(shortname) ),
    refreshComponents: (shortname) => dispatch( project_reload_services(shortname) ),
    updateComponentCatalog: () => dispatch( services_update_catalog() )
  })
)(SettingsView)

export default Settings
