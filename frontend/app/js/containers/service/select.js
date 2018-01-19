import connect from 'app/containers/connect'
import SelectView from 'app/components/service/select'
import { services_update_catalog, services_update_all } from 'app/actions/service'

const ServiceSelect = connect({
  state: (state, props) => {
    let services
    if (props.services)
      services = props.services
    else{
      services = state.services.services || []
      if (props.project == true){
        const project = state.project.current
        services = services.filter( s => s.projects.indexOf(project)>=0)
      }
    }
    return {
      services
    }
  },
  handlers: (dispatch) => ({
  }),
  store_enter: [services_update_all]
})(SelectView)

export default ServiceSelect
