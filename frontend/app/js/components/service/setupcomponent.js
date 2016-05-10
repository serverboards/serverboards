import React from 'react'
import Modal from '../modal'
import GenericForm from '../genericform'
import HoldButton from '../holdbutton'

let SetupComponent=React.createClass({
  getInitialState : function(){
    let r={}
    this.props.component.fields.map( (f) =>{
      r[f.name]=f.value || ''
    })
    return r
  },
  handleAccept : function(ev){
    ev && ev.preventDefault()

    let form = this.refs.form.refs.form
    if ( $(form).form('validate form' ) ){
      console.log("Ok")
      let component=Object.assign({}, this.props.component)
      let values = this.state
      component.fields.map( (f) => {
        f.value=values[f.name] || ''
      })
      this.props.onUpdate( component )
    }
  },
  handleUpdateForm : function(data){
    this.setState(data)
  },
  render: function(){
    let props=this.props
    return (
      <Modal onClose={props.onClose}>
        <div className="header">
          Update settings for {props.component.name}
        </div>
        <div className="content">
          <GenericForm ref="form" fields={props.component.fields} updateForm={this.handleUpdateForm} onSubmit={this.handleAccept}/>
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
