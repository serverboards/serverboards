import React from 'react'
import { connect } from 'react-redux'
import AddView from '../../components/service/add'
import { components_update_catalog, service_add } from '../../actions/service'

var Add=connect(
  (state) => ({
    components: state.service.components
  }),
  (dispatch) => ({
    updateComponentCatalog: () => dispatch( components_update_catalog() ),
    onSubmit: (data) => {
      dispatch( service_add(data) )
    }
  })
)(AddView)

export default Add
