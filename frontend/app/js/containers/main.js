import MainView from 'app/components/main'
import flash from 'app/actions/flash'
import connect from 'app/containers/connect'
import { login, logout, user_settings_accept_license } from 'app/actions/auth'
import { set_modal } from 'app/actions/modal'
import rpc from 'app/rpc'
import i18n from 'app/utils/i18n'

var Main = connect({
  state(state){
    return {
      lang: state.auth.lang,
      logged_in: state.auth.logged_in,
      location: state.routing.locationBeforeTransitions,
      lang_counter: state.auth.lang_counter,
      licenses: state.auth.licenses,
    }
  },
  handlers(dispatch){
    return {
      onLogin: (user) => dispatch(login(user)),
      onLogout: () => {
        rpc.close()
        return dispatch(logout())
      },
      onAcceptLegal(licenseid){
        dispatch(user_settings_accept_license(licenseid))
      }
    }
  },
  loading(state, props){
    // console.log(state, props)
    if (state.auth.logged_in && (props.licenses == undefined))
      return i18n("User data")
    return false
  }
})(MainView)

export default Main
