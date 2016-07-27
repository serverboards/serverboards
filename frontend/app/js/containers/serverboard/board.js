import BoardView from 'app/components/serverboard/board'
import event from 'app/utils/event'
import {serverboards_widget_list} from 'app/actions/serverboard'

const Board = event.subscribe_connect(
  (state) => ({
    widgets: state.serverboard.widgets
  }),
  (dispatch, prop) => ({}),
  (props) => [
    `serverboard.widget.added[${props.serverboard}]`,
    `serverboard.widget.removed[${props.serverboard}]`,
    `serverboard.widget.updated[${props.serverboard}]`
  ],
  (props) => [
    () => serverboards_widget_list(props.serverboard)
  ]
)(BoardView)

export default Board
