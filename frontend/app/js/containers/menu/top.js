import TopView from 'app/components/menu/top'
import Flash from 'app/flash'
import connect from 'app/containers/connect'
import { toggle_sidebar } from 'app/actions/menu'

var Top=connect({
  state: (state) => {
    return {
      sidebar: state.menu.sidebar,
    }
  },
  handlers: (dispatch) => ({
    onToggleSidebar: () => dispatch( toggle_sidebar() ),
  }),
})(TopView)

export default Top
