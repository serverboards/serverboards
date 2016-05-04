import React from 'react'
import { connect } from 'react-redux'
import OverviewView from '../../components/service/overview'

var Overview=connect(
  (state) => ({
    service: state.service.services.find( (s) => s.shortname == state.service.current )
  }),
  (dispatch) => ({
  })
)(OverviewView)

export default Overview
