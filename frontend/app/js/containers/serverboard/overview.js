import React from 'react'
import { connect } from 'react-redux'
import OverviewView from 'app/components/serverboard/overview'

var Overview=connect(
  (state) => ({
    serverboard: state.serverboard.serverboards.find( (s) => s.shortname == state.serverboard.current )
  }),
  (dispatch) => ({
  })
)(OverviewView)

export default Overview
