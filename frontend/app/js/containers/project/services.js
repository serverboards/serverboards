import ServicesView from 'app/components/project/services'
import ServiceAdd from 'app/containers/service/add'
import connect from 'app/containers/connect'
import React from 'react'
import store from 'app/utils/store'

var Services = connect({
  state: (state) => ({
    services: state.project.project.services,
    location: state.routing.locationBeforeTransitions,
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
