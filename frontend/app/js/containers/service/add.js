import React from 'react'
import { connect } from 'react-redux'
import AddView from '../../components/service/add'
import { service_add } from '../../actions/service'

var Add=connect(
  (state) => ({
  }),
  (dispatch) => ({
    onSubmit: (data) => {
      dispatch( service_add(data) )
    }
  })
)(AddView)

export default Add
