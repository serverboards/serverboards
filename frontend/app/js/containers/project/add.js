import React from 'react'
import { connect } from 'react-redux'
import AddView from 'app/components/project/add'
import { project_add } from 'app/actions/project'

var Add=connect(
  (state) => ({
  }),
  (dispatch) => ({
    onSubmit: (data) => {
      dispatch( project_add(data) )
    }
  })
)(AddView)

export default Add
