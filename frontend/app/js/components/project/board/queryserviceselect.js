import React from 'react'
import i18n from 'app/utils/i18n'
import ServiceSelect from 'app/containers/service/select'

const ID_LIST="ABCDEFGHIJKLMNOPQRSTUVWXYZ"

class QueryServiceSelect extends React.Component{
  constructor(props){
    super(props)

    const services = (props.services || []) // format is [id, uuid]

    this.state = {
      openSelector: false,
      selected: undefined,
      services,
      last_service_id: 0 // TODO get max available
    }
  }
  handleToggleSelector(){
    this.setState({openSelector:!this.state.openSelector, selected: undefined})
  }
  handleChangeService(id_uuid){
    this.setState({openSelector: true, selected: id_uuid})
  }
  handleSelectService(newservice){
    let {services, selected, last_service_id} = this.state
    if (this.state.selected){ // replace selected
      services = services.map( s => {
        if (s[0] == selected[0])
          return [s[0], newservice.uuid]
        return s
      })
      selected=[selected[0], newservice.uuid]
    }
    else{ // append to end
      services = services.concat( [[ID_LIST[last_service_id], newservice.uuid]] )
      last_service_id+=1
    }
    this.setState({services, last_service_id, selected})
    this.props.onSetServices(services)
  }
  getServiceName(uuid){
    const service = this.props.all_services.find( s => s.uuid == uuid )
    if (service)
      return service.name
    return "??"
  }
  render(){
    const props = this.props
    const state = this.state
    const selected = state.openSelector && state.selected
    const services = this.state.services
    console.log("services: ", services)
    return (
      <div>
        <label className="ui bold text">{i18n("Add services to apply Service Queries on this widget")}</label>
        <div className="ui service selector list" style={{marginBottom: 20}}>
          {(services || []).map( s => (
            <a className={`ui square basic button ${ (selected && (selected[0] == s[0])) ? "teal" : ""}`}
              onClick={() => this.handleChangeService(s)}>{s[0]}: {this.getServiceName(s[1])}</a>
          ))}
          {state.openSelector ? (
            <a className="ui dashed square basic red button"
               onClick={this.handleToggleSelector.bind(this)}>
              x
            </a>
          ) : (
            <a className="ui dashed square basic teal button"
               onClick={this.handleToggleSelector.bind(this)}>
              +
            </a>
          )}
        </div>
        {state.openSelector && (
          <div>
            <hr/>
            <ServiceSelect
              project={true}
              onSelect={this.handleSelectService.bind(this)}
              selected={state.selected && state.selected[1]}
            />
            <hr/>
          </div>
        )}
      </div>
    )
  }
}

export default QueryServiceSelect
