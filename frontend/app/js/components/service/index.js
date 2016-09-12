import React from 'react'
import ServiceCards from 'app/containers/service/cards'
import ServiceTable from 'app/containers/service/table'
import Loading from 'app/components/loading'

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
