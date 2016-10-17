import {connect} from 'react-redux'
import View from 'app/components/serverboard/board/edit_widget'

const Controller = connect(
  (state, props) => ({
    widget_catalog: state.serverboard.widget_catalog,
    template: state.serverboard.widget_catalog && state.serverboard.widget_catalog.find( (w) => (w.id == props.widget.widget) )
  }),
  (dispatch, prop) => ({}),
)(View)

export default Controller
