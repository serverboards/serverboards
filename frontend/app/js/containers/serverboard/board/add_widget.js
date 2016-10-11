import {connect} from 'react-redux'
import View from 'app/components/serverboard/board/add_widget'

const Controller = connect(
  (state) => ({
    widget_catalog: state.serverboard.widget_catalog
  }),
  (dispatch, prop) => ({}),
)(View)

export default Controller
