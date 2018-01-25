import {connect} from 'react-redux'
import View from 'app/components/project/board/edit_widget'
import rpc from 'app/rpc'
import {set_modal} from 'app/utils/store'

const Controller = connect(
  (state, props) => ({
    widget_catalog: state.project.widget_catalog,
    template: state.project.widget_catalog && (
      state.project.widget_catalog.find( (w) => (w.id == props.widget.widget) ) || "not-found"
    ),
    widget_id: props.widget.widget,
    project: state.project.current,
  }),
  (dispatch, prop) => ({
    saveWidget(data){
      rpc.call("dashboard.widget.update", data).then( () => {
        set_modal(null)
      })
    }
  }),
)(View)

export default Controller
