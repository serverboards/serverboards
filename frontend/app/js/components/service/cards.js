import React from 'react'
import Card from './card_v2'
import Loading from '../loading'
import {i18n} from 'app/utils/i18n'
import {goto} from 'app/utils/store'

export function service_definition(service_type, service_catalog){
  return service_catalog.find( (c) => c.type == service_type )
}

function CardBottom(props){
  return (
    <div className="right">
      <a onClick={(ev) => {ev.stopPropagation(); console.log("details", props)}}><i className="ui teal ellipsis horizontal icon"/></a>
    </div>
  )
}

function Cards(props){
  if (!props.catalog)
    return (
      <Loading>{i18n("Service catalog")}</Loading>
    )
  return (
    <div className="ui cards">
      {props.services.map((p) => (
        <Card
          key={p.uuid}
          service={p}
          onClick={() => goto(`/project/${props.project.shortname}/services/${p.uuid}`)}
          bottomElement={CardBottom}
          />
      ))}
    </div>
  )
}

export default Cards
