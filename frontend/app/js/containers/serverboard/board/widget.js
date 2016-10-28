import {connect} from 'react-redux'
import WidgetView from 'app/components/serverboard/board/widget'

const Widget = connect(
  (state, props) => ({
    widget_catalog: state.serverboard.widget_catalog,
    template: state.serverboard.widget_catalog && state.serverboard.widget_catalog.find( (w) => (w.id == props.widget) ),
    services: state.serverboard.serverboard.services,
  }),
  (dispatch, prop) => ({}),
)(WidgetView)

export default Widget
