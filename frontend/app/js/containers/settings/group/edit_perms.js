import View from 'app/components/settings/group/edit_perms'
import event from 'app/utils/event'
import { group_update_perms,  perm_list } from 'app/actions/auth'
import { set_modal } from 'app/actions/modal'

var Container = event.subscribe_connect(
  (state) => ({
    all_perms: state.auth.all_perms
  }),
  (dispatch) => ({
    onUpdatePerms: (g, to_add, to_remove) => dispatch( group_update_perms(g, to_add, to_remove) ),
    setModal: (modal, data) => dispatch( set_modal(modal, data) )
  }),
  [],
  [perm_list]
)(View)

export default Container
