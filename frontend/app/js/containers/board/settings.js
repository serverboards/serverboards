import {connect} from 'react-redux'
import { board_update, board_remove}  from 'app/actions/project'

import View from 'app/components/board/settings'

const Controller = connect(
  (state) => ({
  }),
  (dispatch, prop) => ({
    onBoardUpdate: (uuid, data) => dispatch( board_update(uuid, data) ),
    onBoardRemove: (uuid) => dispatch( board_remove(uuid) ),
  }),
)(View)

export default Controller
