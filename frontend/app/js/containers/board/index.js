import React from 'react'
import BoardView from 'app/components/board'
import AddWidget from 'app/containers/board/add_widget'
import store from 'app/utils/store'
import {
  project_update_widget_catalog,
  board_update_now,
  board_set_daterange_start_and_end
  } from 'app/actions/project'
import { map_get } from 'app/utils'
import i18n from 'app/utils/i18n'

const Board = store.connect({
  state: (state) => ({
    widgets: map_get(state, ["project", "dashboard", "current", "widgets"]),
    widget_catalog: state.project.widget_catalog,
    realtime: state.project.daterange.rt,
    time_slice: [state.project.daterange.start, state.project.daterange.end],
    time_range: state.project.daterange.range_s,
    dashboard: map_get(state, ["project","dashboard", "current", "uuid"]),
    can_edit: state.auth.user.perms.indexOf("dashboard.update")>=0,
    config: map_get(state, ["project","dashboard", "current", "config"], {}),
  }),
  handlers: (dispatch, prop) => ({
    updateDaterangeNow: () => dispatch( board_update_now() ),
    updateDaterange: (start, end) => dispatch( board_set_daterange_start_and_end(start, end) )
  }),
  subscriptions: (state, props) => {
    const dashboard = props.dashboard
    // console.log("New subscription for dashboard: %o", dashboard)
    if (!props.dashboard)
      return []
    return [
      `dashboard.widget.created[${dashboard}]`,
      `dashboard.widget.deleted[${dashboard}]`,
      `dashboard.widget.updated[${dashboard}]`
    ]
  },
  // Update catalog on entry
  store_enter: (props) => [
    () => project_update_widget_catalog(props.project.current)
  ],
  store_exit: (props) => [
    () => project_update_widget_catalog(null),
  ],
  watch: ['dashboard'], // Watch this prop
  loading(state){
    if (!state.project.dashboard)
      return i18n("Unknown dashboard")
      if (!state.project.dashboard.current)
        return i18n("No current dashboard")
    if (!state.project.widget_catalog)
      return i18n("Widget catalog")
    if (!((state.project.dashboard || {}).current || {}).widgets)
      return i18n("Widgets")
    return false
  }
}, BoardView)

function BoardRouter(props){
  console.log(props)
  if (props.location.pathname.endsWith("/add")){
    console.log("Add")
    return (
      <AddWidget {...props}/>
    )
  }
  return (
    <Board {...props}/>
  )
}

export default BoardRouter
