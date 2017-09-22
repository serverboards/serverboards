import {connect} from 'react-redux'
import View from 'app/components/project/board/add_widget'
import {map_get} from 'app/utils'
import rpc from 'app/rpc'
import {goto} from 'app/utils/store'
import Flash from 'app/flash'
import i18n from 'app/utils/i18n'

const Controller = connect(
  (state) => {
    const dashboard = map_get(state, ["project", "dashboard", "current"], ["project", "dashboards", 0]) || {}
    return {
      widget_catalog: state.project.widget_catalog,
      dashboard_uuid: dashboard.uuid,
      dashboard
    }
  },
  (dispatch, props) => ({
    addWidget(widget, dashboard, config){
      const data={ widget, dashboard, config }

      console.log("real add widget", data)
      rpc.call("dashboard.widget.create", data).then( () => {
        Flash.success(i18n(`Added widget *{name}* to dashboard`, {name: widget}))
        if (props.onClose)
          props.onClose()
        else{
          const project = "SBDS"
          goto(`/project/${project}/dashboard`)
        }
      }).catch( e =>
        Flash.error(i18n(`Could not add widget *{name}* to dashboard: {e}`, {name: widget, e}))
      )
    }
  }),
)(View)

export default Controller
