import UsersView from 'app/components/settings/users'
import event from 'app/utils/event'
import { user_list, user_add, user_update } from 'app/actions/auth'
import { set_modal } from 'app/actions/modal'

var Users = event.subscribe_connect(
  (state) => ({
    users: state.auth.users,
  }),
  (dispatch) => ({
    loadUserList: () => dispatch( user_list() ),
    onAddUser:(user) => dispatch( user_add(user) ),
    onUpdateUser:(email, attributes) => dispatch( user_update(email, attributes) ),
    setModal: (modal, data) => dispatch( set_modal(modal, data) )
  }),
  ["user.updated", "user.added"],
  [user_list]
)(UsersView)

export default Users
