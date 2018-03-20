import React from 'react'
import Modal from 'app/components/modal'
import i18n from 'app/utils/i18n'

class AddUser extends React.Component{
  handleAddUser(ev){
    ev.preventDefault()

    let $form = $(this.refs.form)
    this.props.onAddUser( {
      email: $form.find('[name=email]').val(),
      name: $form.find('[name=name]').val(),
      is_active: true,
    } )
    this.props.setModal(false)
  }
  componentDidMount(){
    $(this.refs.form).form({
      on:'blur',
      fields:{
        email: 'email'
      }
    })
  }
  render(){
    let props=this.props

    return (
      <Modal onClose={props.onClose}>
        <div className="ui top secondary menu">
          <h3>{i18n("Add a new user")}</h3>
        </div>
        <div className="ui content with padding and scroll">
          <form ref="form" className="ui form" onSubmit={this.handleAddUser.bind(this)}>
            <div className="field">
              <label>{i18n("Email")}</label>
              <input type="email" name="email" placeholder={i18n("This will be used as the user identifier")}/>
            </div>
            <div className="field">
              <label>{i18n("Name")}</label>
              <input type="text" name="name"/>
            </div>
            <div className="field">
              <div className="ui accept teal button" onClick={this.handleAddUser.bind(this)}>{i18n("Add user")}</div>
            </div>
          </form>
        </div>
      </Modal>
    )
  }
}

export default AddUser
