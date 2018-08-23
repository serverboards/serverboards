import View from 'app/components/menu/projectselector'
import { push } from 'react-router-redux'
import connect from 'app/containers/connect'
import {project_update_all} from 'app/actions/project'
import {has_perm_guard} from 'app/restricted'

var Container=has_perm_guard("project.get", connect({
  state: (state) => {
    return {
      current: state.project.current,
      projects: state.project.projects || []
    }
  },
  handlers: (dispatch) => ({
    onServiceSelect: (shortname) => dispatch( push( `/project/${shortname}/`) )
  }),
  subscriptions: ["project.created", "project.deleted", "project.updated"],
  store_enter: [project_update_all],
  watch: ["projects", "current"]
})(View))

export default Container
