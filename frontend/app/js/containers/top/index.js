import { login, logout } from 'app/actions/auth'
import TopView from 'app/components/top'
import Event from 'app/utils/event'
import { action_ps } from 'app/actions/action'
import { notifications_unread } from 'app/actions/notifications'
import rpc from 'app/rpc'
import Flash from 'app/flash'

var Top=Event.subscribe_connect(
  (state) => ({
      user: state.auth.user,
      menu: state.top.menu,
      actions: state.action.actions,
      notifications: state.notifications.unread
  }),
  (dispatch) => ({
    onLogout: () => dispatch(logout()),
    toggleMenu: (menu) => dispatch({type: "TOP_TOGGLE_MENU", menu: menu}),
    closeMenu: () => dispatch({type: "TOP_TOGGLE_MENU", menu: ''}),
  }),
  ["action.started","action.stopped","notifications.new","notifications.update"],
  [action_ps, notifications_unread]
)(TopView)

rpc.on("action.stopped", function(data){
  if (data.result=="error")
    Flash.error(`Error running "${data.name}": ${data.reason}`)
})

export default Top
