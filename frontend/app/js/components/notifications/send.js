import React from 'react'
import Modal from '../modal'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import { dispatch_set_modal } from 'app/actions/modal'
import {i18n} from 'app/utils/i18n'

class SendNotification extends React.Component{
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
  }
  componentDidMount(){
    $(this.refs.subject).focus()
  }
  render(){
    const props=this.props
    return (
      <Modal onClose={props.onClose}>
        <div className="ui top header secondary menu">
          <h3 className="ui header">{i18n("Send notification to {user}", {user: props.user.name})}</h3>
        </div>
        <div className="content">
          <div ref="form" className="ui form">
            <div className="field">
              <label>{i18n("Subject")}</label>
              <input name="subject" placeholder="" ref="subject"/>
            </div>
            <div className="field">
              <label>{i18n("Body")}</label>
              <textarea name="body"/>
            </div>
          </div>
          <div className="ui top padding">
            <span className="ui buttons">
              <button className="ui accept teal button" onClick={this.handleSend.bind(this)}>{i18n("Send notification")}</button>
              <button className="ui cancel button" onClick={props.onClose}>{i18n("Cancel")}</button>
            </span>
          </div>
        </div>
      </Modal>
    )
  }
}

export default SendNotification
