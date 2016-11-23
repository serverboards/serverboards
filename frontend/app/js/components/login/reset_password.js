import React from 'react'
import Flash from 'app/flash'
import rpc from 'app/rpc'

const ResetPassword=React.createClass({
  sendEmail(){
    const email=$(this.refs.el).find('input[name=email]').val()
    let self=this

    Flash.info(`Sending email to ${email}`)
    rpc.call('auth.reset_password',[email]).then(function(){
      Flash.info(`Email sent. Check your email at ${email}`)
      self.props.setPassword(email)
    }).catch(function(e){
      Flash.error(`Could not request password reset: ${e}`)
    })
  },
  setPassword(ev){
    const email=$(this.refs.el).find('input[name=email]').val()
    ev.preventDefault()
    this.props.setPassword(email)
  },
  componentDidMount(){
    $(this.refs.el).form({
      on: 'blur',
      fields: {
        email: 'email',
      }
    }).submit((ev) => { ev.preventDefault(); this.setPassword})
  },
  render(){
    const props=this.props
    return (
      <div className="ui login serverboards background diagonal">
        <form ref="el" className="ui form" method="POST">
          <div className="ui small modal active" id="login">
            <div className="header">
              Request email with reset password link
            </div>

            <div className="content">
              <div className="field">
                <label>Email</label>
                <input type="email" name="email" placeholder="user@company.com"
                  defaultValue={props.email}
                  />
              </div>
            </div>

            <div className="actions">
              <a href="#" onClick={this.setPassword}>I already have a password change token</a>
              <button type="button" className="ui right button" onClick={props.closeReset}>
                Cancel
              </button>
              <button type="button" className="ui positive right labeled icon button" onClick={this.sendEmail}>
                Request email
                <i className="caret right icon"></i>
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }
})

export default ResetPassword
