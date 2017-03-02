import ServerboardView from 'app/components/project'
import { push } from 'react-router-redux'
import store from 'app/utils/store'
import { projects_update_info } from 'app/actions/project'

var Project=store.connect({
  state(state){
    return {
      shortname: state.project.current,
      project: state.project.project,
      projects_count: (state.project.projects || []).length
    }
  },
  handlers: (dispatch, props) => ({
    goto(url){ dispatch( push(url) ) },
    onAdd(){ dispatch( push("/project/add") ) },
    onUpdate(){ dispatch( projects_update_info(props.params.project) ) }
  }),
  store_enter: (state, props) => [
    () => projects_update_info(state.project.current),
  ],
  store_exit: (state, props) => [
    () => projects_update_info(),
  ],
  subscriptions: ["service.updated"],
  watch: ["shortname"]
}, ServerboardView)

export default Project
