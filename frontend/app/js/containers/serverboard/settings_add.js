import React from 'react'
import { connect } from 'react-redux'
import SettingsAddView from '../../components/serverboard/settings_add'
import { services_update_catalog } from '../../actions/serverboard'

var SettingsAdd=connect(
  (state) => {
    return {
      available_services: state.serverboard.available_services,
      location: state.routing.locationBeforeTransitions
    }
  },
  (dispatch) => ({
    updateComponentCatalog: () => dispatch( services_update_catalog() )
  })
)(SettingsAddView)

export default SettingsAdd
