import React from 'react'
import Modal from '../modal'
import Loading from '../loading'
import Card from './card'
import rpc from 'app/rpc'
import {merge, dedup} from 'app/utils'
import Flash from 'app/flash'
import { goBack } from 'react-router-redux'
import store from 'app/utils/store'
import ScreensMenu from 'app/components/service/screensmenu'
import event from 'app/utils/event'
import {i18n} from 'app/utils/i18n'

const VirtualServices=React.createClass({
  getInitialState(){
    return {
      services: undefined,
      traits:[],
      screens:[]
    }
  },
  update_services(event){
    let service=event.service
    //console.log("Service change %o", service)
    let changed=false
    let services = this.state.services.map( (s) => {
      if (s.id == service.id){
        changed=true
        return merge(service, {is_virtual:true })
      }
      return s
    })
    if (!changed)
      services.push(service)
    this.setState({services})
    this.update_screens(services)
  },
  update_screens(services){
    const traits=dedup(services.reduce( (acc, s) => acc.concat(s.traits), [] ))
    if (!this.props.screens && traits!=this.state.traits){
      this.setState({traits})
      rpc.call("plugin.components.catalog", {type: "screen", traits: traits}).then( (screens) => {

        screens = screens.map( s => ({
          id: s.id,
          name: s.name,
          icon: s.extra.icon,
          description: s.description,
          traits: s.traits,
          perms: s.extra.perms || []
        })

        this.setState({screens})
      })
    }
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
        self.setState({services})
        if (subscribe){
          rpc.call(`${self.connection}.${subscribe}`, parent.config)
            .then( (subscribe_id) => {
              self.subscribe_id=subscribe_id
              event.on("service.updated", self.update_services)
            })
          }
        self.update_screens(services)
      })
      .catch((e) => {
        console.error(e)
        Flash.error(i18n("Error loading virtual services\n\n{e}", {e}))
        store.dispatch( goBack() )
      })
  },
  componentWillUnmount(){
    const parent=this.props.parent
    let unsubscribe=parent.virtual.unsubscribe
    if (this.subscribe_id)
      rpc.call(`${this.connection}.${unsubscribe}`, [this.subscribe_id])
    event.off("service.updated", self.update_services)
    this.subscribe_id=undefined
  },
  render(){
    const props=this.props
    const state=this.state
    if (state.services == undefined){
      return (
        <Modal>
          <Loading>{i18n("Virtual services for {name}", {name: props.parent.name})}</Loading>
        </Modal>
      )
    }
    return (
      <Modal>
        {state.screens ? (
          <div className="ui vertical menu">
            <ScreensMenu
              screens={state.screens}
              services={state.services}
              />
          </div>
        ) : null}
        <div className="ui container">
          <h1 className="ui header">{i18n("Virtual services for {name}", {name: props.parent.name})}</h1>
          <div className="ui cards">
            {state.services.map((p) => (
              <Card key={p.id} service={p} projects={props.projects} location={props.location}/>
            ))}
          </div>
        </div>
      </Modal>
    )
  }
})

export default VirtualServices
