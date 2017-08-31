import React from 'react'
import Card from './card_v2'
import Loading from '../loading'
import {i18n} from 'app/utils/i18n'
import {goto} from 'app/utils/store'
import {sort_by_name} from 'app/utils'
import Tip from '../tip'

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
  let services = props.services

  services = sort_by_name(services)

  return (
    <div className="ui expand two column grid grey background" style={{margin:0}}>
      <div className="ui column">
        <div className="ui round pane white background">
          <div className="ui attached top form">
            <div className="ui input seamless white">
              <i className="icon search"/>
              <input type="text" onChange={(ev) => this.setFilter(ev.target.value)} placeholder={i18n("Filter...")}/>
            </div>
          </div>
          <div className="ui scroll extend with padding">
            <div className="ui cards">
              {services.map((p) => (
                <Card
                  key={p.uuid}
                  service={p}
                  onClick={() => goto(`/project/${props.project.shortname}/services/${p.uuid}`)}
                  bottomElement={CardBottom}
                  />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="ui column">
        <div className="ui round pane white background">
          <Tip
            subtitle={i18n("Use account connections to manage your services.")}
            description={i18n(`
Select a service to manage from the left list, or create a new one pressing the
add button on bottom left corner.

Clicking over a service shows you more options to perform on the service, as
update the details, or directly access to related tools.
`)}
            />
        </div>
      </div>
    </div>
  )
}

export default Cards
