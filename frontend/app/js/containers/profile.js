import ProfileView from '../components/profile'
import { connect } from 'react-redux'

var Profile=connect(
  (state) => {
    console.log("state is %o", state.auth.user)
    return {
      user: state.auth.user
    }
  },
  (dispatch) => ({})
)(ProfileView)

export default Profile
