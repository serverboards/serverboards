import React from 'react'
import Modal from 'app/components/modal'
import rpc from 'app/rpc'
import Flash from 'app/flash'

const PasswordChange=React.createClass({
  componentDidMount(){
    $(this.refs.form).form({
      on: 'blur',
      fields:{
        current:"empty",
        new_password:"minLength[8]",
        repeat_password:"match[new_password]"
      }
    })
  },
  changePassword(){
    console.log("Change password %o", this.refs)
    let $form=$(this.refs.form)
    let is_valid = $form.form("validate form")
    if (is_valid){
      const current=$form.find('input[name=current]').val()
      const newpassword=$form.find('input[name=new_password]').val()

      rpc.call("auth.set_password", [current, newpassword]).then(() => {
        Flash.info("Password changed properly")
        this.props.onClose()
      }).catch((e) => {
        Flash.error(`Error changing password: ${e}`)
      })
    }
  },
  render(){
    const props=this.props
    return (
      <Modal onClose={props.onClose}>
        <h2 className="ui header">Change password</h2>
        <div ref="form" className="ui form">
          <div className="field">
            <label>Current password</label>
            Enter here you current password
            <input className="ui field" type="password" name="current"/>
          </div>
          <div className="field">
            <label>New password</label>
            Enter here the new password
            <input className="ui field" type="password" name="new_password"/>
          </div>
          <div className="field">
            <label>Repeat password</label>
            Repeat the password for verification
            <input className="ui field" type="password" name="repeat_password"/>
          </div>
          <div className="ui error message"></div>

          <button className="ui submit button yellow" onClick={this.changePassword}>Change password</button>
        </div>
      </Modal>
    )
  }
})
export default PasswordChange
