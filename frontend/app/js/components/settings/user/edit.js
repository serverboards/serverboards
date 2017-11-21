import React from 'react'
import Modal from 'app/components/modal'
import store from 'app/utils/store'
import i18n from 'app/utils/i18n'
import PropTypes from 'prop-types'

class EditUser extends React.Component{
  handleEditUser(ev){
    ev.preventDefault()
    const props=this.props
    const show_is_active = props.user.email != store.getState().auth.user.email
    let is_active = props.user.is_active
    if (show_is_active)
      is_active = $(this.refs.is_active).find('input').is(':checked')  ? true : false

    let $form = $(this.refs.form)
    props.onUpdateUser( props.user.email, {
      name: $form.find('[name=name]').val(),
      is_active,
    } )
    props.onClose()
  }
  componentDidMount(){
    let $form = $(this.refs.form)
    $form.form({
      on:'blur',
      fields:{
        email: 'email'
      }
    })
    $(this.refs.is_active).checkbox()
  }
  render(){
    const props=this.props

    // Only show if not current user
    const show_is_active = props.user.email != store.getState().auth.user.email

    return (
      <Modal onClose={props.onClose}>
        <div className="ui top secondary menu">
          <h3 className="header">Edit {props.user.name}</h3>
          <div className="right menu" style={{alignItems: "center"}}>
            {show_is_active ? (
              <div className="field">
                <div ref="is_active" className="ui toggle checkbox">
                  <label>Is active</label>
                  <input type="checkbox" name="is_active" defaultChecked={props.user.is_active}/>
                </div>
              </div>
            ) : []}
          </div>
        </div>
        <div className="content">
          <div ref="form" className="ui form" onSubmit={this.handleEditUser.bind(this)}>
            <div className="field">
              <label>{i18n("Email")}</label>
              <input disabled="true" type="email" name="email" defaultValue={props.user.email} placeholder={i18n("This will be used as the user identifier")}/>
            </div>
            <div className="field">
              <label>{i18n("First Name")}</label>
              <input type="text" name="name" defaultValue={props.user.name}/>
            </div>
          </div>
          <div className="actions">
            <button className="ui accept teal button" onClick={this.handleEditUser.bind(this)}>{i18n("Update user")}</button>
          </div>
        </div>
      </Modal>
    )
  }
}

EditUser.PropTypes = {
  onUpdateUser: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired
}

export default EditUser
