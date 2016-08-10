import React from 'react'
import Modal from '../modal'
import Loading from '../loading'
import Card from './card'
import rpc from 'app/rpc'
import {merge} from 'app/utils'


const virtual_services = [
  {
    "config": {
      "connection": "546f49ca-6e58-475a-bfd8-8fa2d4301a0b",
      "node": "2b4fb189-06e7-4c2e-8b6d-ae7ad5119424"
    },
    "name": "ubuntu15.10",
    "tags": [
      "stopped"
    ],
    "id": "2b4fb189-06e7-4c2e-8b6d-ae7ad5119424",
    "type": "serverboards.core.cloud/cloud.node",
    'traits': ['core.cloud.node'],
    is_virtual: true
  },
  {
    "config": {
      "connection": "546f49ca-6e58-475a-bfd8-8fa2d4301a0b",
      "node": "ad2a7f49-acf4-45e2-bad6-c7e8dacebc40"
    },
    "name": "fedora23",
    "tags": [
      "stopped"
    ],
    "id": "ad2a7f49-acf4-45e2-bad6-c7e8dacebc40",
    "type": "serverboards.core.cloud/cloud.node",
    'traits': ['core.cloud.node'],
    is_virtual: true
  }
]

const VirtualServices=React.createClass({
  getInitialState(){
    return {services: undefined}
  },
  componentDidMount(){
    const parent=this.props.parent
    let command=parent.virtual.command
    let method=parent.virtual.call
    rpc.call("plugin.start",[ command ])
      .then((uuid) => rpc.call(`${uuid}.${method}`, parent.config))
      .then((services) => {
        services = services.map( (s) => merge(s, {is_virtual: true}) )
        this.setState({services})
        })
      .catch((e) => Flash.error(`Error loading virtual services\n\n${e}`))
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
