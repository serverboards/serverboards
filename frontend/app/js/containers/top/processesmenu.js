import React from 'react';
import ProcessesMenuView from '../../components/top/processesmenu'
import { logout } from '../../actions/auth'
import { connect } from 'react-redux'

var ProcessesMenu = connect(
  (state) => ({
    running : state.action.actions
  }),
  (dispatch) => ({
  })
)(ProcessesMenuView)

export default ProcessesMenu
