import React from 'react'
import Modal from '../../modal'

let AddUser = React.createClass({
  handleAddUser : function(ev){
    ev.preventDefault()

    let $form = $(this.refs.form)
    this.props.onSubmit( {
      email: $form.find('[name=email]').val(),
      first_name: $form.find('[name=first_name]').val(),
      last_name: $form.find('[name=last_name]').val(),
      is_active: true,
    } )
  },
  componentDidMount(){
    $(this.refs.form).form({
      on:'blur',
      fields:{
        email: 'email'
      }
    })
  },
  render(){
    let props=this.props

    return (
      <Modal onClose={props.onClose}>
        <div className="header">
          Add a new user
        </div>
        <div className="content">
          <form ref="form" className="ui form" onSubmit={this.handleAddUser}>
            <div className="field">
              <label>Email</label>
              <input type="email" name="email" placeholder="This will be used as the user identifier"/>
            </div>
            <div className="field">
              <label>First Name</label>
              <input type="text" name="first_name"/>
            </div>
            <div className="field">
              <label>Last Name</label>
              <input type="text" name="last_name"/>
            </div>
          </form>
        </div>
        <div className="actions">
          <div className="ui accept green button" onClick={this.handleAddUser}>Add user</div>
          <div className="ui cancel button" onClick={props.onClose}>Cancel</div>
        </div>
      </Modal>
    )
  }
})

export default AddUser
