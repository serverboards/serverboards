import ServicesView from 'app/components/project/services'
import ServiceAdd from 'app/containers/service/add'
import connect from 'app/containers/connect'
import React from 'react'
import store from 'app/utils/store'
import { map_get } from 'app/utils'

var Services = connect({
  state: (state) => ({
    services: map_get(state.project, ["project", "services"], []),
    location: state.router.location.pathname,
    service_catalog: state.services.catalog || []
  }),
  subcriptions: ["service.updated", "projects.updated"]
})(ServicesView)

function ServicesOrAdd(props){
  if (props.subsection=="add"){
    return <ServiceAdd
      {...props}
      onServiceAdded={(uuid) => store.goto(`/project/${props.project.shortname}/services/${uuid}`)}
      />
  }
  return <Services {...props}/>
}

export default ServicesOrAdd
