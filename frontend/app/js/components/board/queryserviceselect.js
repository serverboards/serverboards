import React from 'react'
import i18n from 'app/utils/i18n'
import ServiceSelect from 'app/containers/service/select'
import GenericForm from 'app/components/genericform'
import {object_is_equal, to_map} from 'app/utils'
import Icon from '../iconicon'

const ID_LIST="ABCDEFGHIJKLMNOPQRSTUVWXYZ"

const STEP_EXTRACTOR = Symbol('extractor')
const STEP_SERVICE = Symbol('service')
const STEP_PARAMS = Symbol('params')

function fix_extractors(props){
  return Object.values(to_map(props.map( ext => [ext.id, ext])))
}

class QueryServiceSelect extends React.Component{
  constructor(props){
    super(props)

    const extractors = fix_extractors(props.extractors || []) // format is [{id, extractor, service}] // service is uuid

    let max_service_id = 0
    for (let e of extractors){
      let eid = ID_LIST.indexOf(e.id)
      if (eid >= max_service_id)
        max_service_id = eid+1
    }

    this.state = {
      open_selector: false,
      selected: {}, // {id, extractor, service, config}
      extractors, // extractors, as a list of {id, extractor, service, config}
      max_service_id, // max id
      services_for_extractor: [], // List of services that can use the current extractor
      step: STEP_EXTRACTOR, // Current wizard step
      selection_ready: false, // Selected extractor is ready to accept to add or update

      extractor: undefined, // current extractor full definition
    }
  }
  componentWillReceiveProps(newprops){
    if (!object_is_equal(newprops.extractors, this.props.extractors)){
      this.setState({extractors: fix_extractors(newprops.extractors)})
    }
  }
  handleOpenSelector(){
    this.handleToggleSelector(true)
  }
  handleCloseSelector(){
    this.handleToggleSelector(false)
  }
  handleToggleSelector(open_selector){
    if (open_selector === undefined){
      open_selector = !this.state.open_selector
    }
    this.setState({
      open_selector,
      selected: {},
      extractor: undefined,
      params: {},
      selection_ready: false,
      step: STEP_EXTRACTOR
    })
  }
  handleChangeExtractor(selected){
    this.setState({open_selector: true, selected, step: STEP_EXTRACTOR})
  }
  handleSelectService(service){
    console.log("Select service", service)
    const state = this.state
    const selected = {...this.state.selected, service: service}
    if (state.extractor.extra.params){
      this.setState({selected, step: STEP_PARAMS})
    } else {
      this.setState({selected, selection_ready: true})
    }
  }
  handleSelectExtractor(extractor){
    const service_type = extractor.extra.service
    const selected = {...this.state.selected, extractor: extractor.id}
    if (service_type){
      const services_for_extractor = this.props.all_services.filter( s => s.type == service_type )
      this.setState({extractor, services_for_extractor, selected, step: STEP_SERVICE})
    } else if (extractor.extra.params){
      this.setState({extractor, selected, step: STEP_PARAMS})
    } else {
      this.setState({selected, selection_ready: true})
    }
  }
  handleAcceptExtractor(){
    const state = this.state
    let {selected, max_service_id, extractors} = state
    if (selected.id){ // update
      extractors = extractors.map( e => {
        if (e.id == selected.id)
          return selected
        else
          return e
      })
    } else { // new
      selected = {...selected, id: ID_LIST[max_service_id]}
      extractors = extractors.concat(selected)
      max_service_id+=1
    }

    this.setState({extractors, max_service_id, open_selector: false, selected: {}})
    this.props.onSetExtractors(extractors)
  }
  updateExtractorConfig(config){
    const selected = {...this.state.selected, config}
    this.setState({selected, selection_ready: true})
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
    const selected = state.open_selector && state.selected || {}
    const extractors = this.state.extractors
    return (
      <div>
        <label className="ui bold text">{i18n("Add extractors to apply Universal Service Queries.")}</label>
        <div className="ui service selector list" style={{marginBottom: 20}}>
          {(extractors || []).map( s => (
            <a key={s.id}
              className={`ui basic button ${ (selected && (selected.id == s.id)) ? "teal" : ""}`}
              onClick={() => this.handleChangeExtractor(s)}>
              {s.id} | {this.getExtractorName(s.extractor)}
              {s.service && (
                <span> | {this.getServiceName(s.service)}</span>
              )}
            </a>
          ))}
          {(!state.open_selector || state.selected.id) ? (
            <a className="ui dashed basic teal button"
               onClick={this.handleOpenSelector.bind(this)}>
              +
            </a>
          ) : (
            <a className="ui dashed teal button">
              +
            </a>
          )}
        </div>
        {state.open_selector && (
          <div>
            <hr/>
            <a className="ui button" style={{width: "100%"}}
               onClick={this.handleCloseSelector.bind(this)}>
              <div>
                <i className="ui chevron up icon"/>
              </div>
            </a>
            {(state.step == STEP_EXTRACTOR) ? (
              <div>
                <label>{i18n("Select an extractor:")}</label>
                <div className="ui cards">
                  {props.known_extractors.map( e => (
                    <div key={e.id}
                        className={`ui narrow card ${selected.extractor == e.id ? "selected" : ""} with pointer`}
                        onClick={() => this.handleSelectExtractor(e)}>
                      <div className="ui padding">
                        <div className="ui split area horizontal" style={{height: "auto"}}>
                          <h3 className="ui expand">{e.name}</h3>
                          <Icon icon={e.icon} plugin={e.plugin} className="ui mini"/>
                        </div>
                        {i18n(e.description)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (state.step == STEP_SERVICE) ? (
              <div>
                <label>{i18n("Select a service to extract data from.")}</label>
                <ServiceSelect
                  project={true}
                  onSelect={(s) => this.handleSelectService(s.uuid)}
                  selected={selected.service}
                  services={state.services_for_extractor}
                />
              </div>
            ) : (state.step == STEP_PARAMS) ? (
              <div>
                <GenericForm
                  fields={state.extractor.extra.params}
                  data={{service_id: selected.service, ...state.selected.config}}
                  updateForm={this.updateExtractorConfig.bind(this)}
                  />
              </div>
            ) : (
              <span>Unknown step {state.step}.</span>
            )}
            {state.selection_ready ? (
              <div className="ui right aligned">
                <a className="ui button teal" onClick={this.handleAcceptExtractor.bind(this)}>
                  {i18n("Accept")}
                </a>
              </div>
            ) : (
              <div className="ui right aligned">
                <a className="ui button disabled">
                  {i18n("Accept")}
                </a>
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
