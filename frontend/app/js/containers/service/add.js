import React from 'react'
import { connect } from 'react-redux'
import AddView from '../../components/service/add'
import { update_components, add_service } from '../../actions/service'

var Add=connect(
  (state) => ({
    components: state.service.components
  }),
  (dispatch) => ({
    updateComponents: () => dispatch( update_components() ),
    onSubmit: (data) => {
      dispatch( add_service(data) )
    }
  })
)(AddView)

export default Add
