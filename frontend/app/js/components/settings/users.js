import React from 'react'
import Loading from '../loading'
import AddUser from './user/add'
import EditUser from './user/edit'
import HoldButton from '../holdbutton'
import SendNotification from '../notifications/send'

const UserRow = React.createClass({
  componentDidMount(){
    $(this.refs.dropdown).dropdown()
  },
  render(){
    const u = this.props.user
    return (
      <tr key={u.email}>
        <td className={u.is_active ? "" : "disabled"}>{u.name}</td>
        <td className={u.is_active ? "" : "disabled"}>{u.email}</td>
        <td className={u.is_active ? "" : "disabled"}>{u.groups.join(' + ')}</td>
        <td className={u.is_active ? "" : "disabled"}>{u.is_active ? "true" : "false"}</td>
        <td className="ui">
          <div className="ui item">
            <div ref="dropdown" className="ui dropdown">
              More
              <i className="dropdown icon"></i>
              <div className="menu" style={{marginLeft: "-6em"}}>
                <a href="#" className="item"
                  onClick={(ev) => { ev.preventDefault(); this.props.onOpenEditUser()}}>
                  Edit user
                  <i className="ui icon edit" style={{float:"right"}}/>
                </a>
                <a href="#" className="item"
                  onClick={(ev) => { ev.preventDefault(); this.props.onOpenSendNotification()}}>
                  Send notification
                  <i className="ui icon mail" style={{float:"right"}}/>
                </a>
                {u.is_active ? (
                  <HoldButton className="item" onHoldClick={this.props.onDisableUser}>
                  Hold to disable
                  <i className="ui icon trash user" style={{paddingLeft: 10}}/>
                  </HoldButton>
                ) : (
                  <HoldButton className="item" onHoldClick={this.props.onEnableUser}>
                  Hold to enable
                  <i className="ui icon enable user" style={{paddingLeft: 10}}/>
                  </HoldButton>
                )}
              </div>
            </div>
          </div>

        </td>
      </tr>
    )
  }
})

const Users=React.createClass({
  handleOpenAddUser(){
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
  handleDisableUser(user){
    this.props.onUpdateUser(user.email, {is_active: false})
  },
  handleEnableUser(user){
    this.props.onUpdateUser(user.email, {is_active: true})
  },
  handleOpenSendNotification : function(user){
    this.setModal('send_notification', user)
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
  getModal() {
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
      case 'send_notification':
        return (
          <SendNotification
            onClose={ () => this.setModal(false) }
            user={modal_state.data}
          />
        )
      break;
    }
  },
  render(){
    if (!this.props.users)
      return (
        <Loading>User list</Loading>
      )

    const modal = this.getModal()

    return (
      <div className="ui container" ref="el">
        <h1>Users</h1>

        <table className="ui table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Groups</th>
              <th>Is active?</th>
              <th style={{width: "8em"}}></th>
            </tr>
          </thead>
          <tbody ref="tbody">
          {this.props.users.map((u) => (
            <UserRow user={u}
              key={u.email}
              onOpenEditUser={() => this.handleOpenEditUser(u)}
              onDisableUser={() => this.handleDisableUser(u)}
              onEnableUser={() => this.handleEnableUser(u)}
              onOpenSendNotification={() => this.handleOpenSendNotification(u)}
              />
          ))}
          </tbody>
        </table>
        <a onClick={this.handleOpenAddUser}><i className="ui massive button add icon floating olive"></i></a>
        {modal}
      </div>
    )
  }
})

export default Users
