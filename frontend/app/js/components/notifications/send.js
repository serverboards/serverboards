import React from 'react'
import Modal from '../modal'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import { dispatch_set_modal } from 'app/actions/modal'

let SendNotification=React.createClass({
  handleSend(){
    let form = $(this.refs.form)
    let data={
      email: this.props.user.email,
      subject: form.find('input[name=subject]').val(),
      body: form.find('textarea[name=body]').val()
    }
    rpc.call("notifications.notify", data).then(()=>{
      Flash.success("Notification sent")
      dispatch_set_modal(false)
    }).catch(()=>{
      Flash.error("Error sending notification.")
    })
  },
  render(){
    const props=this.props
    return (
      <Modal onClose={props.onClose}>
        <div className="ui top header secondary menu">
          <h3 className="ui header">Send notification to {props.user.name}</h3>
        </div>
        <div className="content">
          <form ref="form" className="ui form" onSubmit={this.handleSend}>
            <div className="field">
              <label>Subject</label>
              <input name="subject" placeholder=""/>
            </div>
            <div className="field">
              <label>Body</label>
              <textarea name="body"/>
            </div>
          </form>
        </div>
        <div className="actions">
          <div className="ui accept yellow button" onClick={this.handleSend}>Send notification</div>
          <div className="ui cancel button" onClick={props.onClose}>Cancel</div>
        </div>
      </Modal>
    )
  }
})

export default SendNotification
