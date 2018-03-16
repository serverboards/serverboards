import {connect} from 'react-redux'
import { board_update, board_remove, project_get_dashboard}  from 'app/actions/project'
import store from 'app/utils/store'
import i18n from 'app/utils/i18n'
import Flash from 'app/flash'

import View from 'app/components/board/settings'

const Controller = connect(
  (state) => ({
    list: state
  }),
  (dispatch, prop) => ({
    onBoardUpdate: (uuid, data) => dispatch( board_update(uuid, data) ),
    onBoardRemove: () => {
      const uuid = prop.dashboard.uuid
      const list = store.getState().project.dashboard.list.filter( d => d.uuid != uuid )
      if (list.length == 0){
        Flash.error(i18n("Cant remove last dashboard"))
        return
      }
      const next = list[0].uuid

      dispatch( project_get_dashboard(next) )
      dispatch( board_remove({
        uuid,
        name: prop.dashboard.name
      }))
    }
  }),
)(View)

export default Controller
