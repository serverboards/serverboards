import React from 'react'
import Modal from '../modal'
import Loading from '../loading'
import Card from './card'
import rpc from 'app/rpc'
import {merge} from 'app/utils'
import Flash from 'app/flash'
import { goBack } from 'react-router-redux'
import store from 'app/utils/store'

const VirtualServices=React.createClass({
  getInitialState(){
    return {services: undefined}
  },
  update_services(event){
    let service=event.service
    console.log("Service change %o", service)
    let changed=false
    let services = this.state.services.map( (s) => {
      if (s.id == service.id){
        changed=true
        return service
      }
      return s
    })
    if (!changed)
    services.push(service)
    this.setState({services})
  },
  componentDidMount(){
    const parent=this.props.parent
    let command=parent.virtual.command
    let method=parent.virtual.call
    let subscribe=parent.virtual.subscribe
    let self=this
    rpc.call("plugin.start",[ command ])
      .then((uuid) => {
        self.connection=uuid
        return rpc.call(`${uuid}.${method}`, parent.config)
      })
      .then((services) => {
        services = services.map( (s) => merge(s, {is_virtual: true}) )
        console.log(services)
        self.setState({services})
        if (subscribe){
          rpc.call('event.subscribe',["service.updated"])
          rpc.call(`${self.connection}.${subscribe}`, parent.config)
            .then( (subscribe_id) => {
              self.subscribe_id=subscribe_id
              rpc.on("service.updated", self.update_services)
            })
          }
        })
      .catch((e) => {
        console.error(e)
        Flash.error(`Error loading virtual services\n\n${e}`)
        store.dispatch( goBack() )
      })
  },
  componentWillUnmount(){
    const parent=this.props.parent
    let unsubscribe=parent.virtual.unsubscribe
    if (this.subscribe_id)
      rpc.call(`${this.connection}.${unsubscribe}`, [this.subscribe_id])
    rpc.call('event.unsubscribe',["service.updated"])
    rpc.off("service.updated", self.update_services)
    this.subscribe_id=undefined
  },
  render(){
    const props=this.props
    const state=this.state
    if (state.services == undefined){
      return (
        <Modal>
          <Loading>Virtual services for {props.parent.name}</Loading>
        </Modal>
      )
    }

    return (
      <Modal>
        <div className="ui container">
          <h1 className="ui header">Virtual services for {props.parent.name}</h1>
          <div className="ui cards">
            {state.services.map((p) => (
              <Card key={p.id} service={p} serverboards={props.serverboards} location={props.location}/>
            ))}
          </div>
        </div>
      </Modal>
    )
  }
})

export default VirtualServices
