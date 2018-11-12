import React from 'react'
import Card from './card'
import Loading from '../loading'
import {i18n} from 'app/utils/i18n'
import {goto} from 'app/utils/store'
import store from 'app/utils/store'
import {sort_by_name} from 'app/utils'
import HoldButton from '../holdbutton'
import {service_detach, service_remove} from 'app/actions/service'

export class CardBottom extends React.Component{
  componentDidMount(){
    $(this.refs.dropdown).dropdown()
  }
  detachService(){
    store.dispatch( service_detach(this.props.project.shortname, this.props.service.uuid) )
  }
  removeService(){
    store.dispatch( service_remove(this.props.service.uuid) )
  }
  render(){
    const props = this.props
    // If only one parent, it will remove. Else detach from current project.
    const is_detach = props.service.projects.length > 1
    return (
      <div className="right">
        <div className="ui dropdown" ref="dropdown">
          <a onClick={(ev) => {ev.stopPropagation(); console.log("details", props)}}>
            {props.children || (
              <i className="ui teal ellipsis horizontal icon"/>
            )}
          </a>
          <div className="ui vertical menu">
            <a className="ui item">
              {i18n("Details")}
              <i className="icon id card outline"/>
            </a>
            {is_detach ? (
              <HoldButton className="ui item" onHoldClick={this.detachService.bind(this)}>
                {i18n("Hold to detach from project")}
                <i className="ui trash alternate outline icon"/>
              </HoldButton>
            ) : (
              <HoldButton className="ui item" onHoldClick={this.removeService.bind(this)}>
                {i18n("Hold to remove")}
                <i className="ui trash icon"/>
              </HoldButton>
            )}
          </div>
        </div>
      </div>
    )

  }
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
    const selected_uuid = props.selected_uuid
    // Dyn change as the service config changes. We only store the UUID at the state


    if (filter != ""){
      services = services.filter( s => match_service(s, filter) )
    }

    services = sort_by_name(services)

    return (
      <React.Fragment>
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
                  className={ selected_uuid==p.uuid && "selected"}
                  key={p.uuid}
                  service={p}
                  onClick={() => props.onSelectService(p)}
                  project={props.project}
                  bottomElement={CardBottom}
                  template={props.catalog[p.type] || "error"}
                  />
              ))
            }
          </div>
        </div>
      </React.Fragment>
    )
  }
}

export default Cards
