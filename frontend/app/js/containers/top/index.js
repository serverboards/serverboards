import { login, logout } from 'app/actions/auth'
import TopView from 'app/components/top'
import { action_ps } from 'app/actions/action'
import { notifications_unread } from 'app/actions/notifications'
import { get_issues_count_since } from 'app/actions/issues'
import event from 'app/utils/event'
import Flash from 'app/flash'
import connect from 'app/containers/connect'
import { toggle_sidebar } from 'app/actions/top'

var Top=connect({
  state: (state) => {
    let pathname = state.routing.locationBeforeTransitions.pathname
    let section
    switch (pathname){
      case "/settings/plugins":
        section = "plugins"
        break;
      default:
        section = pathname.replace( /\/(.*?)\/.*/ ,"$1")
    }
    return {
      user: state.auth.user,
      avatar: state.auth.avatar,
      menu: state.top.menu,
      actions: state.action.actions,
      notifications: state.notifications.unread,
      section,
      new_issues: state.issues.new_issues,
      lang: state.auth.lang,
      sidebar: state.top.sidebar,
    }
  },
  handlers: (dispatch) => ({
    onLogout: () => dispatch(logout()),
    toggleMenu: (menu) => dispatch({type: "TOP_TOGGLE_MENU", menu: menu}),
    closeMenu: () => dispatch({type: "TOP_TOGGLE_MENU", menu: ''}),
    onToggleSidebar: () => dispatch( toggle_sidebar() ),
  }),
  subscriptions: [
    "action.started","action.updated","action.stopped",
    "notifications.new","notifications.update",
    "issue.created", "issue.updated"
  ],
  store_enter: [action_ps, notifications_unread, () => {
    const timestamp = localStorage.issues_check_timestamp || "1970-01-01"
    return get_issues_count_since(timestamp)
  }]
})(TopView)

event.on("action.stopped", function(data){
  if (data.result=="error")
    Flash.error(`Error running "${data.name}": ${data.reason}`)
})

export default Top
