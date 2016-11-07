import React from 'react'
import { connect } from 'react-redux'
import View from 'app/components/serverboard/dashboard'

var Controller=connect(
  (state) => ({
    serverboard: state.serverboard.serverboard
  }),
  (dispatch) => ({
  })
)(View)

export default Controller
