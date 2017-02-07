import View from 'app/components/serverboard/serverboardselector'
import { push } from 'react-router-redux'
import connect from 'app/containers/connect'
import {serverboard_update_all} from 'app/actions/serverboard'
import {has_perm_guard} from 'app/restricted'

var Container=has_perm_guard("serverboard.info", connect({
  state: (state) => {
    return {
      current: state.serverboard.current,
      serverboards: state.serverboard.serverboards
    }
  },
  handlers: (dispatch) => ({
    onServiceSelect: (shortname) => dispatch( push( `/serverboard/${shortname}/`) )
  }),
  subscriptions: ["serverboard.added", "serverboard.deleted", "serverboard.updated"],
  store_enter: [serverboard_update_all],
  watch: ["serverboards", "current"]
})(View))

export default Container
