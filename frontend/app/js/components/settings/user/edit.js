import React from 'react'
import Modal from 'app/components/modal'
import store from 'app/utils/store'
import i18n from 'app/utils/i18n'

let EditUser = React.createClass({
  handleEditUser : function(ev){
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
    props.setModal(false)
  },
  componentDidMount(){
    let $form = $(this.refs.form)
    $form.form({
      on:'blur',
      fields:{
        email: 'email'
      }
    })
    $(this.refs.is_active).checkbox()
  },
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
          <form ref="form" className="ui form" onSubmit={this.handleEditUser}>
            <div className="field">
              <label>{i18n("Email")}</label>
              <input disabled="true" type="email" name="email" defaultValue={props.user.email} placeholder={i18n("This will be used as the user identifier")}/>
            </div>
            <div className="field">
              <label>{i18n("First Name")}</label>
              <input type="text" name="name" defaultValue={props.user.name}/>
            </div>
          </form>
          <div className="actions">
            <div className="ui accept teal button" onClick={this.handleEditUser}>{i18n("Update user")}</div>
          </div>
        </div>
      </Modal>
    )
  }
})

export default EditUser
