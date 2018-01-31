import {connect} from 'react-redux'
import { board_set_daterange_start, board_set_daterange_end}  from 'app/actions/project'
import View from 'app/components/board/daterange'

const Controller = connect(
  (state) => ({
    start: state.project.daterange.start,
    end: state.project.daterange.end,
    now: state.project.daterange.now
  }),
  (dispatch, prop) => ({
    onStartChange: (start) => dispatch( board_set_daterange_start(start) ),
    onEndChange: (end) => dispatch( board_set_daterange_end(end) ),
  }),
)(View)

export default Controller
