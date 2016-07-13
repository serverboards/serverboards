import React from 'react'
import Flash from 'app/flash'
import rpc from 'app/rpc'

const ResetPassword=React.createClass({
  sendEmail(){
    const email=$(this.refs.el).find('input[name=email]').val()
    console.log("Reset %o", email)
    rpc.call('auth.reset_password',[email]).then(function(){
      Flash.info(`Check your email at ${email}`)
    }).catch(function(e){
      Flash.error(`Could not request password reset: ${e}`)
    })
  },
  render(){
    const props=this.props
    return (
      <form ref="el" className="ui form" method="POST">
        <div className="ui small modal active" id="login">
          <div className="header">
            Reset password
          </div>

          <div className="content">
            <div className="field">
              <label>Email</label>
              <input type="email" name="email" placeholder="user@company.com"
                />
            </div>
          </div>

          <div className="actions">
            <button type="button" className="ui right button" onClick={props.closeReset}>
              Cancel
            </button>
            <button type="button" className="ui positive right labeled icon button" onClick={this.sendEmail}>
              Reset password
              <i className="caret right icon"></i>
            </button>
          </div>
        </div>
      </form>
    )
  }
})

export default ResetPassword
