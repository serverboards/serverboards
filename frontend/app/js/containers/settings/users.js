import UsersView from '../../components/settings/users'
import { connect } from 'react-redux'
import { user_list } from '../../actions/auth'

var Users = connect(
  (state) => ({
    users: state.auth.users,
  }),
  (dispatch) => ({
    loadUserList: () => dispatch( user_list() )
  })
)(UsersView)

export default Users
