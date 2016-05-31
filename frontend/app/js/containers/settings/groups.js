import GroupsView from '../../components/settings/groups'
import event from '../../utils/event'
import {
    group_list, user_list,
    group_update_perms, group_update_users,
    group_add, group_remove,
    perm_list,
    group_remove_user, group_add_user
  } from '../../actions/auth'

var Groups = event.subscribe_connect(
  (state) => ({
    groups : state.auth.groups,
    location: state.routing.locationBeforeTransitions,
    all_users: (state.auth.users || []).map( (u) => u.email ),
    all_perms: state.auth.all_perms
  }),
  (dispatch) => ({
    loadGroups: () => dispatch( group_list() ),
    loadUsers: () => dispatch( user_list() ),
    onRemoveUser: (g, user) => dispatch( group_remove_user(g, user) ),
    onAddUser: (g, user) => dispatch( group_add_user(g, user) ),
    onUpdatePerms: (g, to_add, to_remove) => dispatch( group_update_perms(g, to_add, to_remove) ),
    onUpdateUsers: (g, to_add, to_remove) => dispatch( group_update_users(g, to_add, to_remove) ),
    onAddGroup: (g) => dispatch( group_add(g) ),
    onRemoveGroup: (g) => dispatch( group_remove(g) ),
    onLoadAllPerms: () => dispatch( perm_list() ),
  }),
  ["group.user_added", "group.user_removed",
   "group.perm_added", "group.perm_removed",
   "group.added", "group.removed",
   "user.updated", "user.added"],
  [group_list, user_list]
)(GroupsView)

export default Groups
