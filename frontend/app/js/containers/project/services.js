import ServicesView from 'app/components/project/services'
import ServiceAdd from 'app/components/service/add'
import connect from 'app/containers/connect'
import React from 'react'

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
    return <ServiceAdd {...props}/>
  }
  return <Services {...props}/>
}

export default ServicesOrAdd
