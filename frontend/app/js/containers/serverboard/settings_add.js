import React from 'react'
import { connect } from 'react-redux'
import SettingsAddView from '../../components/serverboard/settings_add'
import { services_update_catalog, services_update_all } from '../../actions/service'

var SettingsAdd=connect(
  (state) => {
    return {
      //catalog: state.serverboard.catalog,
      location: state.routing.locationBeforeTransitions
    }
  },
  (dispatch) => ({
    updateComponentCatalog: () => dispatch( services_update_catalog() )
  })
)(SettingsAddView)

export default SettingsAdd
