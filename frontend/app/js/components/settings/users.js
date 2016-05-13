import React from 'react'
import Loading from '../loading'
import AddUser from './user/add'
import EditUser from './user/edit'

let Users=React.createClass({
  componentDidMount : function(){
    if (!this.props.users)
      this.props.loadUserList()
  },
  handleOpenAddUser : function(){
    this.setModal('add_user')
  },
  handleAddUser : function(newuser){
    this.props.onAddUser(newuser)

    this.setModal(false)
  },
  handleOpenEditUser : function(user){
    this.setModal('edit_user', user)
  },
  handleEditUser : function(email, attributes){
    this.props.onUpdateUser(email, attributes)

    this.setModal(false)
  },

  contextTypes: {
    router: React.PropTypes.object
  },
  setModal : function( what, data ){
    let modal=what && { what, data }

    this.context.router.push( {
      pathname: this.props.location.pathname,
      state: { modal }
    } )
  },
  getModal : function() {
    let router_state=this.props.location.state
    let modal_state = (router_state && router_state.modal && router_state.modal) || {}
    switch(modal_state.what){
      case 'add_user':
        return (
          <AddUser
            onClose={ () => this.setModal(false) }
            onSubmit={this.handleAddUser}
          />
        )
      break;
      case 'edit_user':
        return (
          <EditUser
            onClose={ () => this.setModal(false) }
            onSubmit={this.handleEditUser}
            user={modal_state.data}
          />
        )
      break;
    }
    return []
  },

  render: function(){
    if (!this.props.users)
      return (
        <Loading>User list</Loading>
      )

    $(this.refs.el).find('.ui.dropdown.button').dropdown()

    let modal = this.getModal()

    /*
    let menu=function(u){
      return (
        <div className="ui buttons">
          <div className="ui floating dropdown icon button">
            <i className="dropdown icon"></i>
            <div className="menu">
              <div className="item"><i className="info icon"
                ></i> More info</div>
              <div className="item"><i className="toggle on icon"
                ></i> Disable</div>
            </div>
          </div>
        </div>
      )
    }
    */

    return (
      <div className="ui text container" ref="el">
        <h1>Users</h1>

        <table className="ui table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Groups</th>
              <th>Is active?</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
          {this.props.users.map((u) => (
            <tr key={u.email}>
              <td className={u.is_active ? "" : "disabled"}>{u.first_name} {u.last_name}</td>
              <td className={u.is_active ? "" : "disabled"}>{u.email}</td>
              <td className={u.is_active ? "" : "disabled"}>{u.groups.join(' + ')}</td>
              <td className={u.is_active ? "" : "disabled"}>{u.is_active ? "true" : "false"}</td>
              <td><a href="#" onClick={(ev) => { ev.preventDefault(); this.handleOpenEditUser(u)}} title="Edit user"><i className="ui icon edit"/></a></td>
            </tr>
          ))}
          </tbody>
        </table>
        <a onClick={this.handleOpenAddUser}><i className="ui massive button add user icon floating olive"></i></a>
        {modal}
      </div>
    )
  }
})

export default Users
