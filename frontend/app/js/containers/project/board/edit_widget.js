import {connect} from 'react-redux'
import View from 'app/components/project/board/edit_widget'

const Controller = connect(
  (state, props) => ({
    widget_catalog: state.dashboard.widget_catalog,
    template: state.dashboard.widget_catalog && state.dashboard.widget_catalog.find( (w) => (w.id == props.widget.widget) )
  }),
  (dispatch, prop) => ({}),
)(View)

export default Controller
