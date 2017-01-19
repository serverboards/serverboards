import event from 'app/utils/event'
import View from 'app/components/service/cards'
import { services_update_catalog } from 'app/actions/service'
import connect from 'app/containers/connect'

var Container = connect({
  state: (state) => {
    return {
      catalog: state.services.catalog
    }
  },
  store_enter: [services_update_catalog]
})(View)

export default Container
