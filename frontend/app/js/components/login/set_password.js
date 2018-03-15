import React from 'react'
import Flash from 'app/flash'
import rpc from 'app/rpc'
import {i18n} from 'app/utils/i18n'

class SetPassword extends React.Component{
  setPassword(){
    const $form=$(this.refs.el)
    if ($(this.refs.el).form('is valid')){
      const email=$form.find('input[name=email]').val()
      const token=$form.find('input[name=token]').val()
      const password=$form.find('input[name=password]').val()
      Flash.info(i18n("Updating password"))
      rpc.call("auth.reset_password",[email, token, password]).then(() => {
        Flash.success(i18n("Password changed successfuly. You can now log in."))
        this.props.closeReset()
      }).catch((e) => {
        Flash.error(i18n("There was an error changing password. Check your change password token.\n {e}", {e}))
      })
    }
  }
  componentDidMount(){
    $(this.refs.el).form({
      on: 'blur',
      fields: {
        token: 'empty',
        password: 'minLength[8]',
        repeat_password: 'match[password]'
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
              {i18n("Set new password")}
            </div>

            <div className="content">
              <div className="field">
                <label>{i18n("Reset token")}</label>
                <input type="text" name="token" defaultValue={props.token} placeholder="As received on the email"
                  />
              </div>
              <div className="field">
                <label>{i18n("Email address")}</label>
                <input type="text" name="email" defaultValue={props.email} placeholder="Account email address"
                  />
              </div>
              <div className="field">
                <label>{i18n("New password")}</label>
                <input type="password" name="password" placeholder="*********"
                  />
              </div>
              <div className="field">
                <label>{i18n("Repeat password")}</label>
                <input type="password" name="repeat_password" placeholder="*********"
                  />
              </div>
            </div>

            <div className="ui centered actions">
              <button type="button" className="ui right button" onClick={props.closeReset.bind(this)}>
                {i18n("Cancel")}
              </button>
              <button type="button" className="ui teal right labeled icon button" onClick={this.setPassword.bind(this)}>
                {i18n("Set new password")}
                <i className="caret right icon"></i>
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }
}

export default SetPassword
