import React from 'react'
import Loading from '../loading'
import HoldButton from '../holdbutton'

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
    this.props.setModal('auth.user.add')
  },
  handleOpenEditUser : function(user){
    this.props.setModal('auth.user.edit', {user})
  },
  handleDisableUser(user){
    this.props.onUpdateUser(user.email, {is_active: false})
  },
  handleEnableUser(user){
    this.props.onUpdateUser(user.email, {is_active: true})
  },
  handleOpenSendNotification : function(user){
    this.props.setModal('notification.send', {user})
  },
  render(){
    if (!this.props.users)
      return (
        <Loading>User list</Loading>
      )

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
      </div>
    )
  }
})

export default Users
