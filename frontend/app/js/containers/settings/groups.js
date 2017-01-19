import GroupsView from 'app/components/settings/groups'
import {
    group_list, user_list,
    group_remove,
  } from '../../actions/auth'
import { set_modal } from 'app/actions/modal'
import connect from 'app/containers/connect'

var Groups = connect({
  state: (state) => ({
    groups : state.auth.groups,
    location: state.routing.locationBeforeTransitions,
    all_users: (state.auth.users || []).map( (u) => u.email ),
    all_perms: state.auth.all_perms
  }),
  handlers: (dispatch) => ({
    onRemoveGroup: (g) => dispatch( group_remove(g) ),
    setModal: (modal, data) => dispatch( set_modal(modal, data) )
  }),
  subscriptions: ["group.user_added", "group.user_removed",
   "group.perm_added", "group.perm_removed",
   "group.added", "group.removed",
   "user.updated", "user.added"],
  store_enter: [group_list, user_list]
})(GroupsView)

export default Groups
