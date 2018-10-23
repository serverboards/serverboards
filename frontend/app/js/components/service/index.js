import React from 'react'
import ServiceCards from 'app/containers/service/cards'
import ServiceTable from 'app/containers/service/table'
import Loading from 'app/components/loading'
import Empty from './empty'
import Tip from '../tip'
import {i18n} from 'app/utils/i18n'
import ServiceDetails from 'app/containers/service/details'

class ServicesView extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      selected_service: undefined
    }
  }
  handleSelectService(selected_service){
    this.setState({selected_service})
  }
  render(){
    const props=this.props
    const selected_service = this.state.selected_service || {}

    return (
      (props.services.length == 0) ? (
        <Empty/>
      ) : (
        <div className="ui expand two column grid grey background" style={{margin:0}}>
          <div className="ui column">
            <div className="ui round pane white background">
              {props.mode == "list" ? (
                <ServiceTable
                  services={props.services}
                  project={props.project}
                  selected_uuid={selected_service.uuid}
                  onSelectService={this.handleSelectService.bind(this)}
                  />
              ) : (
                <ServiceCards
                  services={props.services}
                  project={props.project}
                  selected_uuid={selected_service.uuid}
                  onSelectService={this.handleSelectService.bind(this)}
                  />
              )}
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
    )
  }
}

export default ServicesView
