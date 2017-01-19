import View from 'app/components/issues/index_filters'
import connect from 'app/containers/connect'

var Model=connect({
  state: (state) => ({
    serverboards: state.serverboard.serverboards,
  })
})(View)

export default Model
