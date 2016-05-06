import React from 'react'
import { connect } from 'react-redux'
import SettingsView from '../../components/service/settings'
import { service_delete, service_update } from '../../actions/service'

var Settings=connect(
  (state) => ({
  }),
  (dispatch) => ({
    onUpdate: (shortname, changes) => dispatch( service_update(shortname, changes) ),
    onDelete: (shortname) => dispatch( service_delete(shortname) )
  })
)(SettingsView)

export default Settings
