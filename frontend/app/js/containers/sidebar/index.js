import React from 'react'
import { logout } from 'app/actions/auth'
import SidebarView from 'app/components/sidebar'
import { notifications_unread } from 'app/actions/notifications'
import { get_issues_count_since } from 'app/actions/issues'
import event from 'app/utils/event'
import connect from 'app/containers/connect'
import { action_ps } from 'app/actions/action'
import { toggle_menu, toggle_sidebar } from 'app/actions/top'

const SidebarModel=connect({
  state: (state) => {
    let pathname = state.routing.locationBeforeTransitions.pathname
    let section
    if (pathname == '/_')
      section = 'dashboard'
    else if (pathname == '/user/profile')
      section = pathname.split('/')[2]
    else
      section = pathname.replace( /\/(.*?)\/.*/ ,"$1")

    console.log(pathname, section)

    return {
      user: state.auth.user,
      avatar: state.auth.avatar,
      menu: state.top.menu,
      actions: state.action.actions,
      notifications: state.notifications.unread,
      section,
      new_issues: state.issues.new_issues,
      lang: state.auth.lang,
      sections: {
        main: [
          {id: "dashboards", label: "Dashboards", goto: "/"},
          {id: "issues", label: "Issues", goto: "/issues/"},
          {id: "notifications", label: "Notifications", goto: "/notifications/"},
          {id: "rules", label: "Rules", goto: "/rules/"},
          {id: "project_settings", label: "Project Settings", goto: "/rules/"},
        ],
        settings: [
          {id: "settings", label: "System Settings", goto: "/settings/"},
          {id: "users", label: "Packages", goto: "/settings/plugins"},
          {id: "groups", label: "Groups & Permissions", goto: "/settings/groups"},
          {id: "logs", label: "Logs", goto: "/settings/logs"},
          {id: "packages", label: "Packages", goto: "/settings/plugins"},
        ]
      }
    }
  },
  handlers: (dispatch) => ({
    onLogout: () => dispatch(logout()),
    toggleMenu: (menu) => dispatch(  toggle_menu(menu) ),
    onCloseMenu: () => dispatch( toggle_menu('') ),
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
})(SidebarView)

const MaybeSidebar = connect({
  state: (state) => ({
    sidebar: state.top.sidebar
  })
})( ({sidebar}) => sidebar ? (
  <SidebarModel/>
) : null )

export default MaybeSidebar
