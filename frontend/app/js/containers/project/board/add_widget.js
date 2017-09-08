import {connect} from 'react-redux'
import View from 'app/components/project/board/add_widget'

const Controller = connect(
  (state) => ({
    widget_catalog: state.project.widget_catalog,
    dashboard: state.project.dashboard.current.uuid
  }),
  (dispatch, prop) => ({}),
)(View)

export default Controller
