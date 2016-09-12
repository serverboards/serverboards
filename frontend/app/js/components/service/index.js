import React from 'react'
import ServiceCards from 'app/containers/service/cards'
import ServiceTable from 'app/containers/service/table'
import Loading from 'app/components/loading'

// Two services refer to the same, used for replacing and deleting
export function is_same_service(c1, c2){
  return (
    (c1.id && c1.id == c2.id)
    ||
    (c1.uuid == c2.uuid)
  )
}

export function service_definition(service_type, service_catalog){
  return service_catalog.find( (c) => c.type == service_type )
}

export function setup_fields(service, service_catalog){
  let definition=service_definition(service.type, service_catalog)

  let fields = definition.fields.map( (f) => Object.assign({}, f,
      { value: service.config[f.name] || f.value }
    ) )
  return fields
}

const ServicesView=React.createClass({
  getInitialState(){
    return {
      mode: "grid"
    }
  },
  setListMode(mode){
    this.setState({mode})
  },
  render(){
    const props=this.props
    const state=this.state
    return (
      <div>
        <div className="ui compact icon menu floated right" style={{margin: 10}}>
          <a className={`${state.mode == "list" ? "active" : ""} item`} onClick={() => this.setListMode("list")}>
            <i className="ui icon list"/>
          </a>
          <a className={`${state.mode == "grid" ? "active" : ""} item`} onClick={() => this.setListMode("grid")}>
            <i className="ui icon grid layout"/>
          </a>
        </div>
        {state.mode == "list" ? (
          <ServiceTable services={props.services} serverboard={props.serverboard}/>
        ) : (
          <ServiceCards services={props.services} serverboard={props.serverboard}/>
        )}
      </div>
    )
  }
})

export default ServicesView
