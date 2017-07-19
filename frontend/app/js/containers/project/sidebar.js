import connect from 'app/containers/connect'
import View from 'app/components/project/sidebar'
import { get_issues_count_at_project_since } from 'app/actions/issues'

const Sidebar = connect({
  state(state){
    return {
      new_issues: state.project.issues.new
    }
  },
  store_enter(state){
    let timestamp = localStorage[`issues_${state.project.current}`] || "1970-01-01"
    return [
      () => get_issues_count_at_project_since(state.project.current, timestamp)
    ]
  },
})(View)

export default Sidebar
