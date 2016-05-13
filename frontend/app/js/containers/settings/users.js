import UsersView from '../../components/settings/users'
import { connect } from 'react-redux'
import { user_list, user_add, user_update } from '../../actions/auth'

var Users = connect(
  (state) => ({
    users: state.auth.users,
    location: state.routing.locationBeforeTransitions,
  }),
  (dispatch) => ({
    loadUserList: () => dispatch( user_list() ),
    onAddUser:(user) => dispatch( user_add(user) ),
    onUpdateUser:(email, attributes) => dispatch( user_update(email, attributes) ),
  })
)(UsersView)

export default Users
