import React from 'react'
import LogoIcon from '../logoicon'
import Loading from '../loading'
import Modal from '../modal'
import { default_service_fields } from '../service'

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
      current_service.fields=$.extend(true, [], default_service_fields(current_service.name).concat( current_service.fields ) )
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

      current_service.fields=$.extend(true, [], default_service_fields(current_service.name).concat( current_service.fields ) )
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
        <a key={props.uuid || props.type} className="column center aligned" onClick={(ev) => self.handleAdd(ev, props)} href="#">
          <LogoIcon name={props.name} style={{margin: 'auto'}}/>
          {props.name}
        </a>
      )
    }

    return (
      <Modal onClose={props.onClose}>
        <div className="header">
          Select a service to add
        </div>
        <div className="content">
          <label>Existing services</label>
          <div className="ui five column grid stackable">
            {props.all_services.map((c) => WrappedService(c))}
          </div>
          <label>New services</label>
          <div className="ui five column grid stackable">
            {props.catalog.map((c) => WrappedService(c))}
          </div>
        </div>
        <div className="actions">
          <div className="ui cancel button" onClick={props.onClose}>Cancel</div>
        </div>
      </Modal>
    )
  }
})

export default AddService
