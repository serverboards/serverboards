import connect from 'app/containers/connect'
import {
  board_set_daterange_start_and_end,
  board_set_realtime,
  project_get_dashboard,
    }  from 'app/actions/project'
import View from 'app/components/project/board/header'
import i18n from 'app/utils/i18n'

const Controller = connect({
  state: (state) => ({
    realtime: state.project.realtime,
    dashboard_list: state.project.dashboard.list,
    dashboard_current: state.project.dashboard.current,
    project: state.project.current
  }),
  handlers: (dispatch, prop) => ({
    onDateRangeChange: (start, end) => {
      dispatch(
        board_set_daterange_start_and_end(start, end)
      )
    },
    setRealtime: (enabled) => dispatch( board_set_realtime(enabled) ),
    onDashboardChange: (uuid) => dispatch( project_get_dashboard(uuid) )
  }),
  subscriptions(state, props){
    let project = props.project
    console.log("Subscribe to dashboard events at %o", project)
    return [
      `dashboard.created[${project}]`,
      `dashboard.updated[${project}]`,
      `dashboard.removed[${project}]`,
    ]
  },
  store_enter(state, props){
    return [
      project_get_dashboard, // null dashboard
    ]
  },
})(View)

export default Controller
