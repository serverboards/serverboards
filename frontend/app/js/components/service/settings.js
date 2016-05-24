import React from 'react'
import Modal from '../modal'
import GenericForm from '../genericform'
import HoldButton from '../holdbutton'
import { setup_fields } from '../service'
import Loading from '../loading'

let SetupComponent=React.createClass({
  getInitialState : function(){
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
  render: function(){
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
    return (
      <Modal onClose={props.onClose}>
        <div className="header">
          Update settings for {props.service.name}
        </div>
        <div className="content">
          <GenericForm ref="form" fields={fields} updateForm={this.handleUpdateForm} onSubmit={this.handleAccept}/>
        </div>
        <div className="actions">
          <button className="ui ok green button" onClick={this.handleAccept}>Accept</button>
          <HoldButton className="ui red button" onClick={props.onDelete}>Delete</HoldButton>
          <button className="ui cancel button" onClick={props.onClose}>Cancel</button>
        </div>
      </Modal>
    )
  }
})


export default SetupComponent
