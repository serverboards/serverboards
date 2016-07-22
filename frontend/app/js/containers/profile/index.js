import ProfileView from 'app/components/profile'
import event from 'app/utils/event'
import { notifications_update } from 'app/actions/notifications'
import Flash from 'app/flash'
import rpc from 'app/rpc'
import { user_update } from 'app/actions/auth'

var Profile=event.subscribe_connect(
  (state) => ({
    user: state.auth.user,
  }),
  (dispatch) => ({
    onSubmit: (data) => dispatch( notifications_update(data) ),
    onUpdateUser:(email, attributes) => dispatch( user_update(email, attributes) ),
  })
)(ProfileView)

export default Profile
