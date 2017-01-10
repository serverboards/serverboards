import event from 'app/utils/event'
import View from 'app/components/issues/index_filters'

var Model=event.subscribe_connect(
  (state) => ({
    serverboards: state.serverboard.serverboards,
  }),
  (dispatch) => ({
  })
)(View)

export default Model
