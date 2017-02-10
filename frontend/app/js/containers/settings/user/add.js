import View from 'app/components/settings/user/add'
import connect from 'app/containers/connect'
import { user_add } from 'app/actions/auth'
import { set_modal } from 'app/actions/modal'

var Container = connect({
  state: (state) => ({
  }),
  handlers: (dispatch) => ({
    onAddUser:(user) => dispatch( user_add(user) ),
    setModal: (modal, data) => dispatch( set_modal(modal, data) )
  })
})(View)

export default Container
