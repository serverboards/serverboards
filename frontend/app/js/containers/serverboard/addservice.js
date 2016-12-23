import React from 'react'
import { connect } from 'react-redux'
import AddServiceView from 'app/components/serverboard/addservice'
import { services_update_catalog, services_update_all, service_add } from 'app/actions/service'
import { serverboard_attach_service } from 'app/actions/serverboard'

var AddService=connect(
  (state) => {
    return {
      catalog: state.serverboard.catalog,
      all_services: state.serverboard.all_services,
      location: state.routing.locationBeforeTransitions
    }
  },
  (dispatch) => ({
    updateServiceCatalog: () => dispatch( services_update_catalog() ),
    updateAllServiceCatalog: () => dispatch( services_update_all() ),
    onAttachService: (a,b) => dispatch( serverboard_attach_service(a,b) ),
    onAddService: (a,b) => dispatch( service_add(a,b) ),
  })
)(AddServiceView)

export default AddService
