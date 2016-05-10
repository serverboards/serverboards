import React from 'react'
import { connect } from 'react-redux'
import AddComponentView from '../../components/service/addcomponent'
import { components_update_catalog, components_update_all } from '../../actions/service'

var AddComponent=connect(
  (state) => {
    return {
      available_components: state.service.available_components,
      all_components: state.service.all_components,
      location: state.routing.locationBeforeTransitions
    }
  },
  (dispatch) => ({
    updateComponentCatalog: () => dispatch( components_update_catalog() ),
    updateAllComponentCatalog: () => dispatch( components_update_all() )
  })
)(AddComponentView)

export default AddComponent
