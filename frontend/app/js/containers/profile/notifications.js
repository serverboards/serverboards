import NotificationsView from 'app/components/profile/notifications'
import event from 'app/utils/event'
import { notifications_update_catalog, notifications_update,notifications_config } from 'app/actions/notifications'
import Flash from 'app/flash'
import rpc from 'app/rpc'

var Notifications=event.subscribe_connect(
  (state) => ({
      channels: state.notifications.catalog_with_config,
      config: state.notifications.config
    }),
  (dispatch) => ({
      onSubmit: (data) => dispatch( notifications_update(data) )
    }),
  [],
  [notifications_update_catalog, notifications_config]
)(NotificationsView)

export default Notifications
