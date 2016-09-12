import MainView from 'app/components/main'
import flash from 'app/actions/flash'
import { connect } from 'react-redux'
import { login, logout } from 'app/actions/auth'
import { set_modal } from 'app/actions/modal'
import rpc from 'app/rpc'

var Main=connect(
  (state) => {
    return {
      logged_in: state.auth.logged_in,
      location: state.routing.locationBeforeTransitions
    }
  },
  (dispatch) => {
    return {
      onLogin: (user) => dispatch(login(user)),
      onLogout: () => {
        rpc.close()
        return dispatch(logout())
      }
    }
  }
)(MainView)

export default Main
