import { login, logout } from '../actions/auth'
import { connect } from 'react-redux'
import TopView from '../components/top'


var Top=connect(
  (state) => {
    return {
      email: state.auth.user && state.auth.user.email
    }
  },
  (dispatch) => {
    return {
      onLogout: () => dispatch(logout())
    }
  }
)(TopView)

export default Top
