import ProfileView from 'app/components/profile'
import event from 'app/utils/event'
import { notifications_update_catalog, notifications_update,notifications_config } from 'app/actions/notifications'
import Flash from 'app/flash'
import rpc from 'app/rpc'

var Profile=event.subscribe_connect(
  (state) => ({
    user: state.auth.user,
    channels: state.notifications.catalog_with_config
  }),
  (dispatch) => ({
    handleUpdate: (data) => dispatch( notifications_update(data) )
  }),
  [],
  [notifications_update_catalog, notifications_config]
)(ProfileView)

export default Profile
