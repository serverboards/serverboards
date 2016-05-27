import { login, logout } from '../../actions/auth'
import TopView from '../../components/top'
import Event from '../../utils/event'
import { action_ps } from '../../actions/action'
import rpc from '../../rpc'
import Flash from '../../flash'

var Top=Event.subscribe_connect(
  (state) => ({
      user: state.auth.user,
      menu: state.top.menu,
      actions: state.action.actions
  }),
  (dispatch) => ({
    onLogout: () => dispatch(logout()),
    toggleMenu: (menu) => dispatch({type: "TOP_TOGGLE_MENU", menu: menu}),
    closeMenu: () => dispatch({type: "TOP_TOGGLE_MENU", menu: ''}),
  }),
  ["action.started","action.stopped"],
  [action_ps]
)(TopView)

rpc.on("action.stopped", function(data){
  if (data.result=="error")
    Flash.error(`Error running "${data.name}": ${data.reason}`)
  else
    Flash.info(`Running "${data.name}" finished succesfully`)
})

export default Top
