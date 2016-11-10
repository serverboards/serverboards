import ServerboardView from 'app/components/serverboard'
import { push } from 'react-router-redux'
import event from 'app/utils/event'
import { serverboards_update_info } from 'app/actions/serverboard'

var Serverboard=event.subscribe_connect(
  (state) => {
    return {
      shortname: state.serverboard.current,
      serverboard: state.serverboard.serverboard,
      serverboards_count: (state.serverboard.serverboards || []).length
    }
  },
  (dispatch, props) => ({
    goto(url){ dispatch( push(url) ) },
    onAdd(){ dispatch( push("/serverboard/add") ) },
    onUpdate(){ dispatch( serverboards_update_info(props.params.serverboard) ) }
  }),
  [],
  (props) => [
    () => (serverboards_update_info(props.shortname)),
  ],
  ["shortname"]
)(ServerboardView)

export default Serverboard
