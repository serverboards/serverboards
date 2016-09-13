import ServerboardView from 'app/components/serverboard'
import { push } from 'react-router-redux'
import event from 'app/utils/event'
import { serverboards_update_info } from 'app/actions/serverboard'

var Serverboard=event.subscribe_connect(
  (state) => {
    return {
      shortname: state.serverboard.current,
      serverboard: state.serverboard.serverboard,
    }
  },
  (dispatch, props) => ({
    goto(url){ dispatch( push(url) ) },
    onAdd(){ dispatch( push("/serverboard/add") ) }
  }),
  [],
  (props) => [
    () => (serverboards_update_info(props.shortname)),
  ]
)(ServerboardView)

export default Serverboard
