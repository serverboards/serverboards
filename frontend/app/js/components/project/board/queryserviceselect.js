import React from 'react'
import i18n from 'app/utils/i18n'
import ServiceSelect from 'app/containers/service/select'

const ID_LIST="ABCDEFGHIJKLMNOPQRSTUVWXYZ"

class QueryServiceSelect extends React.Component{
  constructor(props){
    super(props)

    const extractors = (props.extractors || []) // format is [{id, extractor, service}] // service is uuid

    let last_service_id = 0
    for (let e of extractors){
      let eid = ID_LIST.indexOf(e.id)
      if (eid >= last_service_id)
        last_service_id = eid+1
    }

    this.state = {
      openSelector: false,
      selected: undefined,
      extractors,
      last_service_id, // TODO get max available
      extractor: undefined,
      services_for_extractor: [],
    }
  }
  handleToggleSelector(){
    this.setState({openSelector:!this.state.openSelector, selected: undefined, extractor: undefined})
  }
  handleChangeService(id_uuid){
    this.setState({openSelector: true, selected: id_uuid})
  }
  handleSelectService(extractor, service){
    let {extractors, selected, last_service_id} = this.state
    if (this.state.selected){ // replace selected
      extractors = extractors.map( s => {
        if (s.id == selected.id)
          return {id: s.id, service, extractor}
        return s
      })
      selected={id: selected.id, service, extractor}
    }
    else{ // append to end
      extractors = extractors.concat( {
        id: ID_LIST[last_service_id],
        service,
        extractor
      } )
      last_service_id+=1
      this.setState({extractor: undefined})
    }
    this.setState({extractors, last_service_id, selected})
    this.props.onSetExtractors(extractors)
  }
  handleSelectExtractor(extractor){
    const service_type = extractor.extra.service
    if (service_type){
      const services_for_extractor = this.props.all_services.filter( s => s.type == service_type )

      this.setState({extractor: extractor.id, services_for_extractor})
    }
    else{
      this.handleSelectService( extractor.id, null )
    }
  }
  getServiceName(uuid){
    if (!uuid)
      return ""
    const service = this.props.all_services.find( s => s.uuid == uuid )
    if (service)
      return service.name
    return "??"
  }
  getExtractorName(ext){
    const extractor = (this.props.known_extractors || []).find( s => s.id == ext )
    if (extractor)
      return extractor.name
    return "??"
  }
  render(){
    const props = this.props
    const state = this.state
    const selected = state.openSelector && state.selected || {}
    const extractors = this.state.extractors
    return (
      <div>
        <label className="ui bold text">{i18n("Add extractors to apply Service Queries on this widget")}</label>
        <div className="ui service selector list" style={{marginBottom: 20}}>
          {(extractors || []).map( s => (
            <a className={`ui square basic button ${ (selected && (selected.id == s.id)) ? "teal" : ""}`}
              onClick={() => this.handleChangeService(s)}>{s.id}: {this.getExtractorName(s.extractor)} {this.getServiceName(s.service)}</a>
          ))}
          {state.openSelector ? (
            <a className="ui dashed square basic red button"
               onClick={this.handleToggleSelector.bind(this)}>
              {i18n("hide")}
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
            {state.extractor ? (
              <div>
                <label>{i18n("Select a service to extract data from.")}</label>
                <ServiceSelect
                  project={true}
                  onSelect={(s) => this.handleSelectService(this.state.extractor, s.uuid)}
                  selected={selected.service}
                  services={state.services_for_extractor}
                />
              </div>
            ) : (
              <div>
                <label>{i18n("Select an extractor:")}</label>
                <div className="ui cards">
                  {props.known_extractors.map( e => (
                    <div className={`ui narrow card ${selected.extractor == e.id ? "selected" : ""} with pointer`}
                         onClick={() => this.handleSelectExtractor(e)}>
                      <i className={`icon ${e.extra.icon || "database"}`}/>
                      <h3>{e.name}</h3>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <hr/>
          </div>
        )}
      </div>
    )
  }
}

export default QueryServiceSelect
