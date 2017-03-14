import { login, logout } from 'app/actions/auth'
import TopView from 'app/components/top'
import { action_ps } from 'app/actions/action'
import { notifications_unread } from 'app/actions/notifications'
import event from 'app/utils/event'
import Flash from 'app/flash'
import connect from 'app/containers/connect'

var Top=connect({
  state: (state) => ({
      user: state.auth.user,
      avatar: state.auth.avatar,
      menu: state.top.menu,
      actions: state.action.actions,
      notifications: state.notifications.unread
  }),
  handlers: (dispatch) => ({
    onLogout: () => dispatch(logout()),
    toggleMenu: (menu) => dispatch({type: "TOP_TOGGLE_MENU", menu: menu}),
    closeMenu: () => dispatch({type: "TOP_TOGGLE_MENU", menu: ''}),
  }),
  subscriptions: ["action.started","action.updated","action.stopped","notifications.new","notifications.update"],
  store_enter: [action_ps, notifications_unread]
})(TopView)

event.on("action.stopped", function(data){
  if (data.result=="error")
    Flash.error(`Error running "${data.name}": ${data.reason}`)
})

export default Top
