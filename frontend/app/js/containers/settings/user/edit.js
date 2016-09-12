import View from 'app/components/settings/user/edit'
import event from 'app/utils/event'
import { user_update } from 'app/actions/auth'
import { set_modal } from 'app/actions/modal'

var Container = event.subscribe_connect(
  (state) => ({
  }),
  (dispatch) => ({
    onUpdateUser:(email, attributes) => dispatch( user_update(email, attributes) ),
    setModal: (modal, data) => dispatch( set_modal(modal, data) )
  }),
  []
)(View)

export default Container
