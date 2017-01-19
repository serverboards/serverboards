import BoardView from 'app/components/serverboard/board'
import store from 'app/utils/store'
import {
  serverboards_widget_list,
  serverboard_update_widget_catalog,
  board_update_now
  } from 'app/actions/serverboard'

const Board = store.connect({
  state: (state) => ({
    widgets: state.serverboard.widgets,
    widget_catalog: state.serverboard.widget_catalog
  }),
  handlers: (dispatch, prop) => ({
    updateDaterangeNow: () => dispatch( board_update_now() )
  }),
  subscribe: (props) => [
    `serverboard.widget.added[${props.serverboard}]`,
    `serverboard.widget.removed[${props.serverboard}]`,
    `serverboard.widget.updated[${props.serverboard}]`
  ],
  // Update catalog on entry
  store_enter: (props) => [
    () => serverboards_widget_list(props.serverboard.current),
    () => serverboard_update_widget_catalog(props.serverboard.current)
  ],
  store_exit: (props) => [
    () => serverboards_widget_list(null),
    () => serverboard_update_widget_catalog(null),
  ],
  watch: ['serverboard'], // Watch this prop
}, BoardView)

export default Board
