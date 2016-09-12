import event from 'app/utils/event'
import View from 'app/components/service/table'
import { services_update_catalog } from 'app/actions/service'

var Container = event.subscribe_connect(
  (state) => {
    return {
      catalog: state.serverboard.catalog
    }
  },
  (dispatch) => ({
  }),
  [],
  [services_update_catalog]
)(View)

export default Container
