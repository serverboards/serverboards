import GroupsView from '../../components/settings/groups'
import { connect } from 'react-redux'
import {
    group_list, user_list,
    group_update_perms, group_update_users,
    group_add
  } from '../../actions/auth'

var Groups = connect(
  (state) => ({
    groups : state.auth.groups,
    location: state.routing.locationBeforeTransitions,
    all_users: (state.auth.users || []).map( (u) => u.email )
  }),
  (dispatch) => ({
    loadGroups: () => dispatch( group_list() ),
    loadUsers: () => dispatch( user_list() ),
    onUpdatePerms: (g, to_add, to_remove) => dispatch( group_update_perms(g, to_add, to_remove) ),
    onUpdateUsers: (g, to_add, to_remove) => dispatch( group_update_users(g, to_add, to_remove) ),
    onAddGroup : (g) => dispatch( group_add(g) ),
  })
)(GroupsView)

export default Groups
