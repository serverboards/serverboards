import React from 'react'
import ImageIcon from '../imageicon'
import IconIcon from '../iconicon'
import Loading from '../loading'
import Modal from '../modal'

const icon = require("../../../imgs/services.svg")

let AddService=React.createClass({
  componentDidMount(){
    if (!this.props.catalog){
      this.props.updateServiceCatalog()
    }
    if (!this.props.all_services){
      this.props.updateAllServiceCatalog()
    }
  },
  handleAdd(ev, service){
    ev.preventDefault(ev)

    if (service.uuid){
      // Service is a plain services, need to have the fields field
      let current_service=Object.assign({}, this.props.catalog.find((c) => c.type == service.type))
      // set fields values
      current_service.uuid=service.uuid
      current_service.name=service.name
      service.config.name=service.name
      service.config.description=service.description
      current_service.fields.map( (f) => {
        f.value=service.config[f.name]
      })

      this.props.onAttach( current_service )
    }
    else{
      let current_service=Object.assign({}, this.props.catalog.find((c) => c.type == service.type))

      current_service.id=undefined

      this.props.onAdd( current_service )
    }
  },
  render(){
    let props=this.props
    if (!this.props.catalog || !this.props.all_services){
      return (
        <Loading>
          Getting available service list
        </Loading>
      )
    }


    let self=this

    function WrappedService(props){
      return (
        <div key={props.uuid || props.type} className="column center aligned">
          <a onClick={(ev) => self.handleAdd(ev, props)}  className="ui button invisible">
            {props.icon ? (
              <IconIcon src={icon} icon={props.icon} plugin={props.type.split('/',1)[0]}/>
            ) : (
              <ImageIcon src={icon}  name={props.name}/>
            )}
            <div className="ui header small" style={{marginTop: 0}}>{props.name}</div>
          </a>
        </div>
      )
    }

    return (
      <Modal onClose={props.onClose} className="wide">
        <div className="ui top secondary pointing menu">
          <h3 className="ui header">
            Select a service to add
          </h3>
        </div>
        <div className="ui text container">
          <h3 className="ui header" style={{paddingTop:30}}>Already configured in your system</h3>
          <div className="ui five column grid stackable svg">
            {props.all_services.map((c) => WrappedService(c))}
          </div>
          <h3 className="ui header" style={{paddingTop:30}}>New services</h3>
          <div className="ui five column grid stackable">
            {props.catalog.map((c) => WrappedService(c))}
          </div>
        </div>
      </Modal>
    )
  }
})

export default AddService
