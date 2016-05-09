import React from 'react'
import { connect } from 'react-redux'
import AddComponentView from '../../components/service/addcomponent'
import { components_update_catalog } from '../../actions/service'

var AddComponent=connect(
  (state) => {
    return {
      available_components: state.service.available_components,
      location: state.routing.locationBeforeTransitions
    }
  },
  (dispatch) => ({
    updateComponentCatalog: () => dispatch( components_update_catalog() )
  })
)(AddComponentView)

export default AddComponent
