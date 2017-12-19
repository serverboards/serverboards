import {connect} from 'react-redux'
import View from 'app/components/project/board/edit_widget'

const Controller = connect(
  (state, props) => ({
    widget_catalog: state.project.widget_catalog,
    template: state.project.widget_catalog && (
      state.project.widget_catalog.find( (w) => (w.id == props.widget.widget) ) || "not-found"
    ),
    widget_id: props.widget.widget,
  }),
  (dispatch, prop) => ({}),
)(View)

export default Controller
