import ProfileView from 'app/components/profile'
import event from 'app/utils/event'
import { notifications_update } from 'app/actions/notifications'
import Flash from 'app/flash'
import rpc from 'app/rpc'

var Profile=event.subscribe_connect(
  (state) => ({
    user: state.auth.user,
  }),
  (dispatch) => ({
    onSubmit: (data) => dispatch( notifications_update(data) )
  })
)(ProfileView)

export default Profile
