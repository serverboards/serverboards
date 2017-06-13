import {connect} from 'react-redux'
import { board_set_daterange_start_and_end }  from 'app/actions/project'
import View from 'app/components/project/board/header'

const Controller = connect(
  (state) => ({
  }),
  (dispatch, prop) => ({
    onDateRangeChange: (start, end) => dispatch( board_set_daterange_start_and_end(start, end) ),
  }),
)(View)

export default Controller
