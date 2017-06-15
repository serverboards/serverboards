import {connect} from 'react-redux'
import { board_set_daterange_start_and_end, board_set_realtime }  from 'app/actions/project'
import View from 'app/components/project/board/header'

const Controller = connect(
  (state) => ({
    realtime: state.project.realtime
  }),
  (dispatch, prop) => ({
    onDateRangeChange: (start, end) => dispatch( board_set_daterange_start_and_end(start, end) ),
    setRealtime: (enabled) => dispatch( board_set_realtime(enabled) )
  }),
)(View)

export default Controller
