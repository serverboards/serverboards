import React from 'react'
import Modal from '../modal'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import { dispatch_set_modal } from 'app/actions/modal'
import {i18n} from 'app/utils/i18n'

let SendNotification=React.createClass({
  handleSend(){
    let form = $(this.refs.form)
    let data={
      email: this.props.user.email,
      subject: form.find('input[name=subject]').val(),
      body: form.find('textarea[name=body]').val()
    }
    rpc.call("notifications.create", data).then(()=>{
      Flash.success(i18n("Notification sent"))
      dispatch_set_modal(false)
    }).catch(()=>{
      Flash.error(i18n("Error sending notification."))
    })
  },
  render(){
    const props=this.props
    return (
      <Modal onClose={props.onClose}>
        <div className="ui top header secondary menu">
          <h3 className="ui header">{i18n("Send notification to {user}", {user: props.user.name})}</h3>
        </div>
        <div className="content">
          <form ref="form" className="ui form" onSubmit={this.handleSend}>
            <div className="field">
              <label>{i18n("Subject")}</label>
              <input name="subject" placeholder=""/>
            </div>
            <div className="field">
              <label>{i18n("Body")}</label>
              <textarea name="body"/>
            </div>
          </form>
        </div>
        <div className="actions">
          <div className="ui accept yellow button" onClick={this.handleSend}>{i18n("Send notification")}</div>
          <div className="ui cancel button" onClick={props.onClose}>{i18n("Cancel")}</div>
        </div>
      </Modal>
    )
  }
})

export default SendNotification
