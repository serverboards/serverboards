import React from 'react'
import Modal from '../modal'
import GenericForm from '../genericform'

let SetupComponent=React.createClass({
  handleAccept : function(){
    let component=Object.assign({}, this.props.component)
    let values = this.state
    component.fields.map( (f) => {
      f.value=values[f.name] || ''
    })
    this.props.onUpdate( component )
  },
  handleUpdateForm : function(data){
    console.log("Update form data ", data)
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
          <GenericForm fields={props.component.fields} updateForm={this.handleUpdateForm}/>
        </div>
        <div className="actions">
          <div className="ui ok green button" onClick={this.handleAccept}>Accept</div>
          <div className="ui cancel button" onClick={props.onClose}>Cancel</div>
        </div>
      </Modal>
    )
  }
})


export default SetupComponent
