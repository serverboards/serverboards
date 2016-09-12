import View from 'app/components/settings/user/add'
import event from 'app/utils/event'
import { user_add } from 'app/actions/auth'
import { set_modal } from 'app/actions/modal'

var Container = event.subscribe_connect(
  (state) => ({
  }),
  (dispatch) => ({
    onAddUser:(user) => dispatch( user_add(user) ),
    setModal: (modal, data) => dispatch( set_modal(modal, data) )
  }),
  []
)(View)

export default Container
