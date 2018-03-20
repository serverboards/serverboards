import React from 'react'
import Flash from 'app/flash'
import rpc from 'app/rpc'
import {i18n} from 'app/utils/i18n'

class ResetPassword extends React.Component{
  sendEmail(){
    const email=$(this.refs.el).find('input[name=email]').val()
    let self=this

    // Flash.info(`Sending email to ${email}`)
    rpc.call('auth.reset_password',[email]).then(function(){
      Flash.info(i18n("Check **{email}**'s email inbox for further password recovery instructions.", {email}))
      self.props.setPassword(email)
    }).catch(function(e){
      Flash.error(i18n("Could not request password reset: {e}", {e}))
    })
  }
  setPassword(ev){
    const email=$(this.refs.el).find('input[name=email]').val()
    ev.preventDefault()
    this.props.setPassword(email)
  }
  componentDidMount(){
    $(this.refs.el).form({
      on: 'blur',
      fields: {
        email: 'email',
      }
    }).submit((ev) => { ev.preventDefault(); this.setPassword})
  }
  render(){
    const props=this.props
    return (
      <div className="ui login serverboards background diagonal">
        <form ref="el" className="ui form" method="POST">
          <div className="ui small modal active" id="login">
            <div className="header">
              {i18n("Request email with reset password link")}
            </div>

            <div className="content">
              <div className="field">
                <label>{i18n("Email")}</label>
                <input type="email" name="email" placeholder="user@company.com"
                  defaultValue={props.email}
                  />
                <a href="#" onClick={this.setPassword.bind(this)}>{i18n("I already have a password change token")}</a>
              </div>
            </div>

            <div className="ui centered actions">
              <button type="button" className="ui right button" onClick={props.closeReset}>
                {i18n("Cancel")}
              </button>
              <button type="button" className="ui teal right labeled icon button" onClick={this.sendEmail.bind(this)}>
                {i18n("Request email")}
                <i className="caret right icon"></i>
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }
}

export default ResetPassword
