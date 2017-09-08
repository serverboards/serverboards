import View from 'app/components/issues/index_filters'
import connect from 'app/containers/connect'

var Model=connect({
  state: (state) => ({
    projects: state.project.projects,
  })
})(View)

export default Model
