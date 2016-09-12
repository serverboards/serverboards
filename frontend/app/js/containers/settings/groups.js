import GroupsView from 'app/components/settings/groups'
import event from 'app/utils/event'
import {
    group_list, user_list,
    group_remove,
  } from '../../actions/auth'
import { set_modal } from 'app/actions/modal'

var Groups = event.subscribe_connect(
  (state) => ({
    groups : state.auth.groups,
    location: state.routing.locationBeforeTransitions,
    all_users: (state.auth.users || []).map( (u) => u.email ),
    all_perms: state.auth.all_perms
  }),
  (dispatch) => ({
    onRemoveGroup: (g) => dispatch( group_remove(g) ),
    setModal: (modal, data) => dispatch( set_modal(modal, data) )
  }),
  ["group.user_added", "group.user_removed",
   "group.perm_added", "group.perm_removed",
   "group.added", "group.removed",
   "user.updated", "user.added"],
  [group_list, user_list]
)(GroupsView)

export default Groups
