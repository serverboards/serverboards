import React from 'react'
import { logout } from 'app/actions/auth'
import SidebarView from 'app/components/menu/sidebar'
import { notifications_unread } from 'app/actions/notifications'
import { get_issues_count_since } from 'app/actions/issues'
import event from 'app/utils/event'
import connect from 'app/containers/connect'
import { toggle_menu, toggle_sidebar, toggle_project_selector, update_screens } from 'app/actions/menu'
import { project_update_all } from 'app/actions/project'
import { i18n_nop } from 'app/utils/i18n'
import { map_get } from 'app/utils'
import { has_perm } from 'app/utils/perms'

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

    const project = state.project.current
    // console.log(pathname, section)

    const screens = state.menu.screens
      .filter( s => s.traits.indexOf("hidden") <0 )
      .map( s => ({
        id: s.id,
        label: s.name,
        perm: s.extra.perms || "plugin",
        traits: s.traits,
        goto: `/project/${project}/${s.id}/`,
      }))
    const project_screens = screens
      .filter( s => s.traits.indexOf("global")<0 )
    const global_screens = screens
      .filter( s => s.traits.indexOf("global")>=0 )
      .map( s => {
        s.goto = `/s/${s.id}/`
        return s
      })

    const project_selector = (
      (map_get(state.project, ["projects", "length"], 0) > 1)
      || has_perm("project.create")
    )

    return {
      user: state.auth.user,
      avatar: state.auth.avatar,
      menu: state.menu.menu,
      actions: state.action.actions,
      notifications: state.notifications.unread,
      section,
      new_issues: state.issues.new_issues,
      lang: state.auth.lang,
      project: map_get( state.project, ["project", "name"], project),
      pathname,
      project_selector,
      sections: {
        project: [
          {id: "dashboard", label: i18n_nop("Dashboards"), goto: `/project/${project}/`},
          {id: "services", label: i18n_nop("Services"), goto: `/project/${project}/services/`, perm: "service.get"},
          {id: "rules", label: i18n_nop("Rules"), goto: `/project/${project}/rules_v2/`, perm: "rules.view"},
          ...project_screens,
          {id: "project_settings", label: i18n_nop("Project Settings"), goto: `/project/${project}/settings/`, perm: "project.update"},
        ],
        global: [
          {id: "issues", label: i18n_nop("Issues"), goto: `/issues/`, perm: "issues.view"},
          {id: "notifications", label: i18n_nop("Notifications"), goto: "/notifications/list", perm: "notifications.list"},
          ...global_screens,
        ],
        settings: [
          {id: "settings", label: i18n_nop("Serverboards Settings"), goto: "/settings/", perm: "settings.view"},
        ]
      }
    }
  },
  handlers: (dispatch) => ({
    onLogout: () => dispatch(logout()),
    toggleMenu: (menu) => dispatch(  toggle_menu(menu) ),
    onCloseMenu: () => dispatch( toggle_menu('') ),
    onToggleSidebar: () => dispatch( toggle_sidebar() ),
    onToggleProjectSelector: () => dispatch( toggle_project_selector() ),
  }),
  store_enter: [ update_screens, project_update_all ]
})(SidebarView)

const MaybeSidebar = connect({
  state: (state) => ({
    sidebar: state.menu.sidebar
  })
})( ({sidebar}) => sidebar ? (
  <SidebarModel/>
) : (
  null
) )

export default MaybeSidebar
