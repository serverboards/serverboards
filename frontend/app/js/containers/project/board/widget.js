import {connect} from 'react-redux'
import WidgetView from 'app/components/project/board/widget'

const Widget = connect(
  (state, props) => ({
    widget_catalog: state.project.widget_catalog,
    template: state.project.widget_catalog && state.project.widget_catalog.find( (w) => (w.id == props.widget) ),
    services: state.project.project.services,
  }),
  (dispatch, prop) => ({}),
)(WidgetView)

export default Widget
