import BoardView from 'app/components/project/board'
import store from 'app/utils/store'
import {
  projects_widget_list,
  project_update_widget_catalog,
  board_update_now
  } from 'app/actions/project'

const Board = store.connect({
  state: (state) => ({
    widgets: state.dashboard.widgets,
    widget_catalog: state.dashboard.widget_catalog
  }),
  handlers: (dispatch, prop) => ({
    updateDaterangeNow: () => dispatch( board_update_now() )
  }),
  subscriptions: (state, props) => {
    return [
      `dashboard.widget.added[${props.project}]`,
      `dashboard.widget.removed[${props.project}]`,
      `dashboard.widget.updated[${props.project}]`
    ]
  },
  // Update catalog on entry
  store_enter: (props) => [
    () => projects_widget_list(props.project.current),
    () => project_update_widget_catalog(props.project.current)
  ],
  store_exit: (props) => [
    () => projects_widget_list(null),
    () => project_update_widget_catalog(null),
  ],
  watch: ['project'], // Watch this prop
  loading(state){
    if (!state.dashboard.widget_catalog)
      return "Widget catalog"
    return false
  }
}, BoardView)

export default Board
