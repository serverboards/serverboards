import React from 'react'
import { connect } from 'react-redux'
import SettingsAddView from 'app/components/project/settings_add'
import { services_update_catalog, services_update_all } from 'app/actions/service'

var SettingsAdd=connect(
  (state) => {
    return {
      //catalog: state.services.catalog,
      location: state.router.location.pathname
    }
  },
  (dispatch) => ({
    updateComponentCatalog: () => dispatch( services_update_catalog() )
  })
)(SettingsAddView)

export default SettingsAdd
