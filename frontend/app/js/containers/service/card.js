import React from 'react'
import { connect } from 'react-redux'
import CardView from '../../components/service/card'
import { service_detach } from '../../actions/service'

var Card = connect(
  (state) => {
    return {
      location: state.routing.locationBeforeTransitions
    }
  },
  (dispatch) => ({
    onDetach:(sbds, service) => dispatch( service_detach(sbds, service) )
  })
)(CardView)

export default Card
