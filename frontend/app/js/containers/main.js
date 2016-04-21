import MainView from '../components/main'
import flash from '../actions/flash'
import { connect } from 'react-redux'
import { login, logout } from '../actions/auth'

var Main=connect(
  (state) => {
    return {
      logged_in: state.auth.logged_in
    }
  },
  (dispatch) => {
    console.log("Got main dispatch functions")
    return {
      onLogin: (user) => dispatch(login(user)),
      onLogout: () => dispatch(logout())
    }
  }
)(MainView)

export default Main
