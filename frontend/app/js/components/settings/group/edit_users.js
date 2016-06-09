import React from 'react'
import Modal from 'app/components/modal'

let EditPerms=React.createClass({
  getInitialState:function(){
    let users = this.props.group.users.map( (u) => ({email: u, is_active: true}) )
    let candidates_to_add = $.makeArray( $(this.props.allUsers).not(this.props.group.users) )

    return { users, candidates_to_add }
  },
  componentDidMount(){
    let $form=$(this.refs.form)
    $form.form()
    $form.find('.ui.checkbox').checkbox()
    $form.find('.ui.dropdown').dropdown()
  },
  handleAddUser(){
    let username=$(this.refs.form).find('select[name=to_add]').val()
    if (!username)
      return
    let users = this.state.users.concat({email: username, is_active: true})
    let candidates_to_add = this.state.candidates_to_add.filter( (u) => u!=username )

    this.setState({ users, candidates_to_add })

  },
  handleSubmit(){
    let current = $.makeArray(
        $(this.refs.form).find('input[type=checkbox]:checked')
      ).map( (f) => f.name )

    this.props.onSubmit( current )
  },
  render(){
    let props=this.props

    return (
      <Modal onClose={props.onClose}>
        <div className="header">
          Update users at {props.group.name}
        </div>
        <div className="content">
          <form ref="form" className="ui form" onSubmit={(ev) => { ev.preventDefault(); this.handleSubmit() }}>
            <label className="ui header">Add new users</label>
            <div className="ui field inline">
              <label>User email</label>
              <select className="ui search dropdown" name="to_add">
              {this.state.candidates_to_add.map( (u) => (
                <option name={u}>{u}</option>
              ))}
              </select> &nbsp;
              <button type="button" className="ui right labeled icon button" onClick={this.handleAddUser}>
                <i className="ui icon add"/>
                Add</button>
            </div>

            <label className="ui header">Users</label>
            {this.state.users.map( (u) => (
              <div key={u.email} className="field">
                <div className="ui checkbox">
                  <input type="checkbox" defaultChecked={u.is_active} name={u.email}/>
                  <label>{u.email}</label>
                </div>
              </div>
            ))}
          </form>
        </div>
        <div className="actions">
          <button type="button" className="ui accept green button" onClick={this.handleSubmit}>Accept changes</button>
          <button type="button" className="ui cancel button" onClick={props.onClose}>Cancel</button>
        </div>
      </Modal>
    )
  }
})

export default EditPerms
