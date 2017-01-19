import UsersView from 'app/components/settings/users'
import { user_list, user_add, user_update } from 'app/actions/auth'
import { set_modal } from 'app/actions/modal'
import connect from 'app/containers/connect'

var Users = connect({
  state: (state) => ({
    users: state.auth.users,
  }),
  handlers: (dispatch) => ({
    loadUserList: () => dispatch( user_list() ),
    onAddUser:(user) => dispatch( user_add(user) ),
    onUpdateUser:(email, attributes) => dispatch( user_update(email, attributes) ),
    setModal: (modal, data) => dispatch( set_modal(modal, data) )
  }),
  subscriptions: ["user.updated", "user.added"],
  store_enter: [user_list]
})(UsersView)

export default Users
