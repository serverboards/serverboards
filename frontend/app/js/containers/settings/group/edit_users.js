import View from 'app/components/settings/group/edit_users'
import event from 'app/utils/event'
import { group_update_users,  perm_list } from 'app/actions/auth'
import { set_modal } from 'app/actions/modal'

var Container = event.subscribe_connect(
  (state) => ({
    groups : state.auth.groups,
    all_users: (state.auth.users || []).map( (u) => u.email ),
  }),
  (dispatch) => ({
    onUpdateUsers: (g, to_add, to_remove) => dispatch( group_update_users(g, to_add, to_remove) ),
    setModal: (modal, data) => dispatch( set_modal(modal, data) )
  }),
  []
)(View)

export default Container
