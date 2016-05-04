import React from 'react'
import { connect } from 'react-redux'
import SettingsView from '../../components/service/settings'
import { service_delete } from '../../actions/service'

var Settings=connect(
  (state) => ({
    components: []
  }),
  (dispatch) => ({
    updateComponents: () => dispatch( update_components() ),
    onDelete: (shortname) => dispatch( service_delete(shortname) )
  })
)(SettingsView)

export default Settings
