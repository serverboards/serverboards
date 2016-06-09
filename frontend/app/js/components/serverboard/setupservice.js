import React from 'react'
import Modal from '../modal'
import GenericForm from '../genericform'
import HoldButton from '../holdbutton'

let SetupComponent=React.createClass({
  getInitialState(){
    let r={}
    this.props.service.fields.map( (f) =>{
      r[f.name]=f.value || ''
    })
    return r
  },
  handleAccept(ev){
    ev && ev.preventDefault()

    let form = this.refs.form.refs.form
    if ( $(form).form('validate form' ) ){
      console.log("Ok")
      let service=Object.assign({}, this.props.service)
      let values = this.state
      service.fields.map( (f) => {
        f.value=values[f.name] || ''
      })
      this.props.onUpdate( service )
    }
  },
  handleUpdateForm(data){
    this.setState(data)
  },
  render(){
    let props=this.props
    return (
      <Modal onClose={props.onClose}>
        <div className="header">
          Update settings for {props.service.name}
        </div>
        <div className="content">
          <GenericForm ref="form" fields={props.service.fields} updateForm={this.handleUpdateForm} onSubmit={this.handleAccept}/>
        </div>
        <div className="actions">
          <button className="ui ok green button" onClick={this.handleAccept}>Accept</button>
          <HoldButton className="ui red button" onHoldClick={props.onDelete}>Delete</HoldButton>
          <button className="ui cancel button" onClick={props.onClose}>Cancel</button>
        </div>
      </Modal>
    )
  }
})


export default SetupComponent
