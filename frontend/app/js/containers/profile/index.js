import ProfileView from 'app/components/profile'
import Flash from 'app/flash'
import rpc from 'app/rpc'
import store from 'app/utils/store'
import {
    user_update, user_update_avatar,
    user_settings_set_language, user_settings_set_tracking
  } from 'app/actions/auth'
import connect from 'app/containers/connect'
import {i18n} from 'app/utils/i18n'


function update_notifications(notifications){
  let promises = []
  const email = store.getState().auth.user.email

  for (let channel in notifications){
    const config = notifications[channel]
    promises.push(
      rpc.call("notifications.config.update", {
        email,
        channel,
        is_active: config ? !!config.is_active : false,
        config: config || {}
      })
    )
  }
  return Promise.all(promises)
}


var Profile=connect({
  state: (state) => ({
    user: state.auth.user,
    lang_counter: state.auth.lang_counter,
    avatar: state.auth.avatar,
    tracking: state.auth.tracking,
  }),
  handlers: (dispatch) => ({
    onSubmit: (data) => {
      dispatch( user_settings_set_tracking(data.tracking) )
      update_notifications(data.notifications)
        .catch(Flash.error)
      Flash.success(i18n("Updated user settings"))
    },
    onUpdateUser:(email, attributes) => dispatch( user_update(email, attributes) ),
    onUpdateAvatar: (avatar) => dispatch( user_update_avatar(avatar) ),
    onSetLanguage: (lang) => dispatch( user_settings_set_language(lang) )
  })
})(ProfileView)

export default Profile
