import React from 'react'
import Modal from 'app/components/modal'

let EditUser = React.createClass({
  handleEditUser : function(ev){
    ev.preventDefault()

    let $form = $(this.refs.form)
    this.props.onSubmit( this.props.user.email, {
      first_name: $form.find('[name=first_name]').val(),
      last_name: $form.find('[name=last_name]').val(),
      is_active: $(this.refs.is_active).find('input').is(':checked')  ? true : false,
    } )
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
    let props=this.props

    return (
      <Modal onClose={props.onClose}>
        <div className="header">
          Edit user &lt;{props.user.email}&gt;

          <form className="ui form" style={{float: "right"}}>
            <div className="ui field floating right">
              <div ref="is_active" className="ui toggle checkbox">
                <label>Is active</label>
                <input type="checkbox" name="is_active" defaultChecked={props.user.is_active}/>
              </div>
            </div>
          </form>

        </div>
        <div className="content">
          <form ref="form" className="ui form" onSubmit={this.handleEditUser}>
            <div className="field">
              <label>Email</label>
              <input disabled="true" type="email" name="email" defaultValue={props.user.email} placeholder="This will be used as the user identifier"/>
            </div>
            <div className="field">
              <label>First Name</label>
              <input type="text" name="first_name" defaultValue={props.user.first_name}/>
            </div>
            <div className="field">
              <label>Last Name</label>
              <input type="text" name="last_name" defaultValue={props.user.last_name}/>
            </div>
          </form>
        </div>
        <div className="actions">
          <div className="ui accept green button" onClick={this.handleEditUser}>Update user</div>
          <div className="ui cancel button" onClick={props.onClose}>Cancel</div>
        </div>
      </Modal>
    )
  }
})

export default EditUser
