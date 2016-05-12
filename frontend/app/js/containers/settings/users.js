import UsersView from '../../components/settings/users'
import { connect } from 'react-redux'
import { user_list, user_add } from '../../actions/auth'

var Users = connect(
  (state) => ({
    users: state.auth.users,
    location: state.routing.locationBeforeTransitions,
  }),
  (dispatch) => ({
    loadUserList: () => dispatch( user_list() ),
    onAddUser:(user) => dispatch( user_add(user) ),
  })
)(UsersView)

export default Users
