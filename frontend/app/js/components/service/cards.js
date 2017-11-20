import React from 'react'
import Card from './card_v2'
import Loading from '../loading'
import {i18n} from 'app/utils/i18n'
import {goto} from 'app/utils/store'
import {sort_by_name} from 'app/utils'
import Tip from '../tip'
import ServiceDetails from 'app/containers/service/details'

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

function match_service(s, filter){
  for (const f of filter){
    let ret = false
    if ((s.name || "").toLowerCase().includes(f))
      ret = true
    if ((s.description || "").toLowerCase().includes(f))
      ret = true
    if ((s.type || "").toLowerCase().includes(f))
      ret = true
    for (const s of (s.status || []))
      if (s.toLowerCase().includes(f))
        ret = true
    if (!ret)
      return false
  }
  return true
}

class Cards extends React.Component{
  constructor(props){
    super(props)
    this.state={
      filter: "",
      filterTimeout: undefined,
      selected_service: undefined
    }
  }
  setFilter(filter){
    if (this.state.filterTimeout){
      clearTimeout(this.state.filterTimeout)
    }
    const filterTimeout = setTimeout( () => {
      this.setState({filter: filter.toLowerCase().split(' ').filter( x => x), filterTimeout: undefined})
    }, 300)

    this.setState({filterTimeout})
  }
  render(){
    const props = this.props
    if (!props.catalog)
      return (
        <Loading>{i18n("Service catalog")}</Loading>
      )
    let services = props.services
    const {filter} = this.state
    const selected_service_uuid = this.state.selected_service
    // Dyn change as the service config changes. We only store the UUID at the state
    const selected_service = props.services.find( s => s.uuid == selected_service_uuid )


    if (filter != ""){
      services = services.filter( s => match_service(s, filter) )
    }

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
                {services.length==0 ? (
                  <div className="ui meta with padding">{i18n("No items found.")}</div>
                ) : services.map((p) => (
                    <Card
                      className={ selected_service && selected_service.uuid==p.uuid ? "selected" : ""}
                      key={p.uuid}
                      service={p}
                      onClick={() => this.setState({selected_service: p.uuid})}
                      bottomElement={CardBottom}
                      />
                  ))
                }
              </div>
            </div>
          </div>
        </div>
        <div className="ui column">
          <div className="ui round pane white background">
            {selected_service ? (
              <ServiceDetails
                key={selected_service.uuid}
                service={selected_service}
                />
            ) : (
              <Tip
                subtitle={i18n("Use account connections to manage your services.")}
                description={i18n(`
Select a service to manage from the left list, or create a new one pressing the
add button on bottom left corner.

Clicking over a service shows you more options to perform on the service, as
update the details, or directly access to related tools.
                  `)}
                />
            ) }
          </div>
        </div>
      </div>
    )
  }
}

export default Cards
