import React from 'react'
import { connect } from 'react-redux'
import SettingsAddView from '../../components/service/settings_add'
import { components_update_catalog } from '../../actions/service'

var SettingsAdd=connect(
  (state) => {
    return {
      components: state.service.components,
      location: state.routing.locationBeforeTransitions
    }
  },
  (dispatch) => ({
    updateComponentCatalog: () => dispatch( components_update_catalog() )
  })
)(SettingsAddView)

export default SettingsAdd
