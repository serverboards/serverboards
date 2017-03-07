import {connect} from 'react-redux'
import View from 'app/components/project/board/add_widget'

const Controller = connect(
  (state) => ({
    widget_catalog: state.dashboard.widget_catalog
  }),
  (dispatch, prop) => ({}),
)(View)

export default Controller
