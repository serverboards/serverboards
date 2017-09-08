import View from 'app/components/settings/group/add'
import connect from 'app/containers/connect'
import { group_add } from 'app/actions/auth'
import { set_modal } from 'app/actions/modal'

var Container = connect({
  state: (state) => ({
  }),
  handlers: (dispatch) => ({
    onAddGroup: (g) => dispatch( group_add(g) ),
    setModal: (modal, data) => dispatch( set_modal(modal, data) )
  }),
})(View)

export default Container
