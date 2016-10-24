import {connect} from 'react-redux'
import { board_set_daterange_start, board_set_daterange_end}  from 'app/actions/serverboard'
import View from 'app/components/serverboard/board/daterange'

const Controller = connect(
  (state) => ({
    start: state.serverboard.daterange.start,
    end: state.serverboard.daterange.end
  }),
  (dispatch, prop) => ({
    onStartChange: (start) => dispatch( board_set_daterange_start(start) ),
    onEndChange: (end) => dispatch( board_set_daterange_end(end) ),
  }),
)(View)

export default Controller
