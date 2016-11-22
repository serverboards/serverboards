import View from 'app/components/serverboard/serverboardselector'
import { push } from 'react-router-redux'
import event from 'app/utils/event'
import {serverboard_update_all} from 'app/actions/serverboard'
import {has_perm_guard} from 'app/restricted'

var Container=has_perm_guard("serverboard.info", event.subscribe_connect(
  (state) => {
    //console.log(state)
    return {
      current: state.serverboard.current,
      serverboards: state.serverboard.serverboards
    }
  },
  (dispatch) => ({
    onServiceSelect: (shortname) => dispatch( push( `/serverboard/${shortname}/`) )
  }),
  ["serverboard.added", "serverboard.deleted", "serverboard.updated"],
  [serverboard_update_all]
)(View))

export default Container
