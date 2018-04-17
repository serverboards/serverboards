import ProfileView from 'app/components/profile'
import { notifications_update } from 'app/actions/notifications'
import Flash from 'app/flash'
import rpc from 'app/rpc'
import {
    user_update, user_update_avatar,
    user_settings_set_language, user_settings_set_tracking
  } from 'app/actions/auth'
import connect from 'app/containers/connect'

var Profile=connect({
  state: (state) => ({
    user: state.auth.user,
    lang_counter: state.auth.lang_counter,
    avatar: state.auth.avatar,
    tracking: state.auth.tracking,
  }),
  handlers: (dispatch) => ({
    onSubmit: (data) => {
      dispatch( notifications_update(data) )
      dispatch( user_settings_set_tracking(data.tracking) )
    },
    onUpdateUser:(email, attributes) => dispatch( user_update(email, attributes) ),
    onUpdateAvatar: (avatar) => dispatch( user_update_avatar(avatar) ),
    onSetLanguage: (lang) => dispatch( user_settings_set_language(lang) )
  })
})(ProfileView)

export default Profile
