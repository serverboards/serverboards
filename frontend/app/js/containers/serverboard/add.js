import React from 'react'
import { connect } from 'react-redux'
import AddView from '../../components/serverboard/add'
import { serverboard_add } from '../../actions/serverboard'

var Add=connect(
  (state) => ({
  }),
  (dispatch) => ({
    onSubmit: (data) => {
      dispatch( serverboard_add(data) )
    }
  })
)(AddView)

export default Add
