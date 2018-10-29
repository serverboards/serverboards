import {connect} from 'react-redux'
import WidgetView from 'app/components/board/widget'
import {map_get} from 'app/utils'

const Widget = connect(
  (state, props) => ({
    widget_catalog: state.project.widget_catalog,
    template: map_get(state, ["project", "widget_catalog", props.widget]),
    services: map_get(state, ["project", "project", "services"], [])
  }),
  (dispatch, prop) => ({}),
)(WidgetView)

export default Widget
