import React from 'react';
import ProcessesMenuView from 'app/components/top/processesmenu'
import { logout } from 'app/actions/auth'
import { connect } from 'react-redux'

var ProcessesMenu = connect(
  (state) => ({
    running : state.action.actions
  }),
  (dispatch) => ({
  })
)(ProcessesMenuView)

export default ProcessesMenu
