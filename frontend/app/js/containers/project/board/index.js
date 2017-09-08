import BoardView from 'app/components/project/board'
import store from 'app/utils/store'
import {
  project_update_widget_catalog,
  board_update_now,
  board_set_daterange_start_and_end
  } from 'app/actions/project'
import { map_get } from 'app/utils'

const Board = store.connect({
  state: (state) => ({
    widgets: map_get(state, ["project", "dashboard", "current", "widgets"]),
    widget_catalog: state.project.widget_catalog,
    realtime: state.project.realtime,
    time_slice: [state.project.daterange.start, state.project.daterange.end],
    dashboard: map_get(state, ["project","dashboard", "current", "uuid"])
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
      `dashboard.widget.removed[${dashboard}]`,
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
    if (!state.project.widget_catalog)
      return "Widget catalog"
    if (!((state.project.dashboard || {}).current || {}).widgets)
      return "Widgets"
    return false
  }
}, BoardView)

export default Board
