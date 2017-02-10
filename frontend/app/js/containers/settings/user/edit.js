import View from 'app/components/settings/user/edit'
import connect from 'app/containers/connect'
import { user_update } from 'app/actions/auth'
import { set_modal } from 'app/actions/modal'

var Container = connect({
  handlers: (dispatch) => ({
    onUpdateUser:(email, attributes) => dispatch( user_update(email, attributes) ),
    setModal: (modal, data) => dispatch( set_modal(modal, data) )
  })
})(View)

export default Container
