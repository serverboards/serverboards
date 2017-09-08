import View from 'app/components/settings/group/edit_perms'
import connect from 'app/containers/connect'
import { group_update_perms,  perm_list } from 'app/actions/auth'
import { set_modal } from 'app/actions/modal'

var Container = connect({
  state(state) {
    return {
      all_perms: state.auth.all_perms
    }
  },
  handlers(dispatch){
    return {
      onUpdatePerms: (g, to_add, to_remove) => dispatch( group_update_perms(g, to_add, to_remove) ),
      setModal: (modal, data) => dispatch( set_modal(modal, data) )
    }
  },
  store_enter: [perm_list],
  loading(state, props){
    if (!props.all_perms)
      return "Loading Permissions"
    return false
  }
})(View)

export default Container
