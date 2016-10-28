import React from 'react'
import { connect } from 'react-redux'
import View from 'app/components/serverboard/dashboard'

var Controller=connect(
  (state) => ({
    serverboard: state.serverboard.serverboards.find( (s) => s.shortname == state.serverboard.current )
  }),
  (dispatch) => ({
  })
)(View)

export default Controller
