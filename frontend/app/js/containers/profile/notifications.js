import NotificationsView from 'app/components/profile/notifications'
import { notifications_update_catalog, notifications_update,notifications_config } from 'app/actions/notifications'
import Flash from 'app/flash'
import rpc from 'app/rpc'
import connect from 'app/containers/connect'

var Notifications=connect({
  state: (state) => ({
      channels: state.notifications.catalog_with_config,
      config: state.notifications.config.get
    }),
  handlers: (dispatch) => ({
      onSubmit: (data) => dispatch( notifications_update(data) )
    }),
  store_enter: [notifications_update_catalog, notifications_config]
})(NotificationsView)

export default Notifications
