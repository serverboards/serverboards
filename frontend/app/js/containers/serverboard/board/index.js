import BoardView from 'app/components/serverboard/board'
import event from 'app/utils/event'
import {
  serverboards_widget_list,
  serverboard_update_widget_catalog,
  board_update_now
  } from 'app/actions/serverboard'

const Board = event.subscribe_connect(
  (state) => ({
    widgets: state.serverboard.widgets,
    widget_catalog: state.serverboard.widget_catalog
  }),
  (dispatch, prop) => ({
    updateDaterangeNow: () => dispatch( board_update_now() )
  }),
  (props) => [
    `serverboard.widget.added[${props.serverboard}]`,
    `serverboard.widget.removed[${props.serverboard}]`,
    `serverboard.widget.updated[${props.serverboard}]`
  ],
  // Update catalog on entry
  (props) => [
    () => serverboards_widget_list(props.serverboard),
    () => serverboard_update_widget_catalog(props.serverboard)
  ],
  ['serverboard'], // Watch this prop
)(BoardView)

export default Board
