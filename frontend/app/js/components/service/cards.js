import React from 'react'
import Card from 'app/containers/service/card'
import Loading from '../loading'
import {i18n} from 'app/utils/i18n'

export function service_definition(service_type, service_catalog){
  return service_catalog.find( (c) => c.type == service_type )
}

function Cards(props){
  if (!props.catalog)
    return (
      <Loading>{i18n("Service catalog")}</Loading>
    )
  return (
    <div className="ui cards">
      {props.services.map((p) => (
        <Card key={p.uuid} service={p} project={props.project} service_description={service_definition(p.type, props.catalog)}/>
      ))}
    </div>
  )
}

export default Cards
