import React from 'react'
import Modal from '../modal'
import GenericForm from '../genericform'
import { setup_fields, service_definition } from '../service'
import Loading from '../loading'

let SetupComponent=React.createClass({
  getInitialState(){
    let fields=undefined
    if (this.props.service_catalog){
      fields = this.get_fields()
    }
    return {fields,
      values:
        Object.assign({name: this.props.service.name}, this.props.service.config)
    }
  },
  handleAccept : function(ev){
    ev && ev.preventDefault()

    let form = this.refs.form.refs.form
    if ( $(form).form('validate form' ) ){
      console.log("Ok %o", this.state.values)
      let operations={}
      let values = this.state.values
      this.get_fields().map( (f) => {
        let v = values[f.name]
        if (v)
          operations[f.name]=v
      })
      console.log(operations)
      let name = operations.name
      delete operations.name
      this.props.onUpdate( this.props.service.uuid, {
        name: name,
        config: operations
      } )
      this.props.onClose()
    }
  },
  handleUpdateForm : function(data){
    this.setState({values:data})
  },
  get_fields(){
    if (this.state && this.state.fields)
      return this.state.fields
    return setup_fields(this.props.service, this.props.service_catalog)
  },
  render(){
    let props=this.props
    let state=this.state
    if (!props.service_catalog)
      return (
        <Loading>
        Service catalog
        </Loading>
      )
    let fields = state.fields
    if (!fields)
      fields=this.get_fields()
    let servicedef=service_definition(this.props.service.type, this.props.service_catalog)
    return (
      <Modal onClose={props.onClose}>
        <h2 className="ui header">
          Update settings for {props.service.name}
        </h2>
        <div className="ui meta" style={{paddingBottom: 20}}>
          {servicedef.description || "No description at service definition"}
        </div>
        <div className="content">
          <GenericForm ref="form" fields={fields} updateForm={this.handleUpdateForm} onSubmit={this.handleAccept}/>
        </div>
        <div className="actions">
          <button className="ui ok green button" onClick={this.handleAccept}>Accept</button>
        </div>
      </Modal>
    )
  }
})


export default SetupComponent
