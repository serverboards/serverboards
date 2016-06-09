import SidebarView from 'app/components/sidebar'
import { push } from 'react-router-redux'
import event from 'app/utils/event'
import {serverboard_update_all} from 'app/actions/serverboard'

var Sidebar=event.subscribe_connect(
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
)(SidebarView)

export default Sidebar
