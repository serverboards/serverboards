import ServerboardView from 'app/components/serverboard'
import { push } from 'react-router-redux'
import store from 'app/utils/store'
import { serverboards_update_info } from 'app/actions/serverboard'

var Serverboard=store.connect({
  state(state){
    return {
      shortname: state.serverboard.current,
      serverboard: state.serverboard.serverboard,
      serverboards_count: (state.serverboard.serverboards || []).length
    }
  },
  handlers: (dispatch, props) => ({
    goto(url){ dispatch( push(url) ) },
    onAdd(){ dispatch( push("/serverboard/add") ) },
    onUpdate(){ dispatch( serverboards_update_info(props.params.serverboard) ) }
  }),
  store_enter: (state, props) => [
    () => serverboards_update_info(state.serverboard.current),
  ],
  store_exit: (state, props) => [
    () => serverboards_update_info(),
  ],
  watch: ["shortname"]
}, ServerboardView)

export default Serverboard
