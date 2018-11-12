import ServerboardView from 'app/components/project'
import store from 'app/utils/store'
import { projects_update_info } from 'app/actions/project'

var Project=store.connect({
  state(state){
    if (state.project.current != "/" && localStorage.last_project != state.project.current){
      localStorage.last_project = state.project.current
    }
    return {
      shortname: state.project.current,
      project: state.project.project,
      screens: state.menu.screens,
      projects_count: (state.project.projects || []).length
    }
  },
  handlers: (dispatch, props) => ({
    goto(url){
      // console.log(url)
      store.goto(url.pathname || url, url.state)
    },
    onAdd(){ dispatch( store.set_modal("project.add") ) },
    onUpdate(){ dispatch( projects_update_info(props.params.project) ) }
  }),
  store_enter: (state, props) => [
    () => projects_update_info(state.project.current),
  ],
  store_exit: (state, props) => [
    () => projects_update_info(),
  ],
  subscriptions: (state) => ([
    "service.deleted",
    "service.updated",
    `project.updated[${state.project.current}]`
  ]),
  watch: ["shortname"]
}, ServerboardView)

export default Project
