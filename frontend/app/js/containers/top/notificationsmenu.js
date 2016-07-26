import React from 'react';
import NotificationsMenuView from 'app/components/top/notificationsmenu'
import { logout } from 'app/actions/auth'
import { connect } from 'react-redux'

var NotificationsMenu = connect(
  (state) => ({
    unread : state.notifications.unread
  }),
  (dispatch) => ({
  })
)(NotificationsMenuView)

export default NotificationsMenu
