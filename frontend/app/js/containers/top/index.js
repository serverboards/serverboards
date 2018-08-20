import TopView from 'app/components/top'
import Flash from 'app/flash'
import connect from 'app/containers/connect'
import { toggle_sidebar } from 'app/actions/top'

var Top=connect({
  state: (state) => {
    return {
      sidebar: state.top.sidebar,
    }
  },
  handlers: (dispatch) => ({
    onToggleSidebar: () => dispatch( toggle_sidebar() ),
  }),
})(TopView)

export default Top
