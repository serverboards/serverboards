import { login, logout } from '../../actions/auth'
import { connect } from 'react-redux'
import TopView from '../../components/top'


var Top=connect(
  (state) => {
    return {
      user: state.auth.user,
      menu: state.top.menu
    }
  },
  (dispatch) => {
    return {
      onLogout: () => dispatch(logout()),
      toggleUserMenu: () => dispatch({type: "TOP_TOGGLE_MENU", menu: 'user'}),
      closeMenu: () => dispatch({type: "TOP_TOGGLE_MENU", menu: ''}),
    }
  }
)(TopView)

export default Top
