import React from 'react'
import { connect } from 'react-redux'
import View from 'app/components/project/dashboard'

var Controller=connect(
  (state) => ({
    project: state.project.project
  }),
  (dispatch) => ({
  })
)(View)

export default Controller
