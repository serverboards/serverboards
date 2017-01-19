import View from 'app/components/service/table'
import connect from 'app/containers/connect'
import { services_update_catalog } from 'app/actions/service'

var Container = connect({
  state: (state) => {
    return {
      catalog: state.services.catalog
    }
  },
  store_enter: [services_update_catalog]
})(View)

export default Container
