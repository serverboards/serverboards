import React from 'react'
import { connect } from 'react-redux'
import CardView from '../../components/service/card'

var Card = connect(
  (state) => {
    return {
      location: state.routing.locationBeforeTransitions
    }
  },
  (dispatch) => ({
  })
)(CardView)

export default Card
