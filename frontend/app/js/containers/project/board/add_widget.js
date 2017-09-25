import connect from 'app/containers/connect'
import View from 'app/components/project/board/add_widget'
import {map_get} from 'app/utils'
import rpc from 'app/rpc'
import {goto} from 'app/utils/store'
import Flash from 'app/flash'
import i18n from 'app/utils/i18n'

const Controller = connect({
  state: (state) => {
    const dashboard = map_get(state, ["project", "dashboard", "current"], ["project", "dashboards", 0]) || {}
    return {
      widget_catalog: state.project.widget_catalog,
      dashboard_uuid: dashboard.uuid,
      dashboard
    }
  },
  handlers: (dispatch, props) => ({
    addWidget(widget, dashboard, config){
      const data={ widget, dashboard, config }

      return rpc.call("dashboard.widget.create", data).then( () => {
        Flash.success(i18n(`Added widget *{name}* to dashboard`, {name: widget}))
      }).catch( e =>
        {
          console.error(e)
          Flash.error(i18n(`Could not add widget *{name}* to dashboard: {e}`, {name: widget, e}))
        }
      )
    },
    onClose(){
      console.log(this, props)
      if (props.onClose == undefined ){
        const project = props.project
        return goto(`/project/${project}/dashboard`)
      }
      if (!props.onClose){ // onClose == false
        return
      }
      props.onClose()
    }
  }),
  subscriptions: (state, props) => {
    const dashboard = props.dashboard_uuid
    console.log("New subscription for dashboard: %o", dashboard)
    if (!dashboard)
      return []
    return [
      `dashboard.widget.created[${dashboard}]`,
      `dashboard.widget.removed[${dashboard}]`,
      `dashboard.widget.updated[${dashboard}]`
    ]
  },
})(View)

export default Controller
