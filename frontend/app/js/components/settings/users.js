import React from 'react'
import Loading from '../loading'
import HoldButton from '../holdbutton'
import Restricted from 'app/restricted'
import i18n from 'app/utils/i18n'

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
        <td className={u.is_active ? "" : "disabled"}>{u.is_active ? i18n("true") : i18n("false")}</td>
        <td className="ui">
          <Restricted perm="auth.modify_any OR notifications.create_all">
            <div className="ui item">
              <div ref="dropdown" className="ui dropdown">
                {i18n("More")}
                <i className="dropdown icon"></i>
                <div className="menu" style={{marginLeft: "-6em"}}>
                  <Restricted perm="auth.modify_any">
                    <a href="#" className="item"
                      onClick={(ev) => { ev.preventDefault(); this.props.onOpenEditUser()}}>
                      {i18n("Edit user")}
                      <i className="ui icon edit" style={{float:"right"}}/>
                    </a>
                  </Restricted>
                  <Restricted perm="notifications.create_all">
                    <a href="#" className="item"
                      onClick={(ev) => { ev.preventDefault(); this.props.onOpenSendNotification()}}>
                      {i18n("Send notification")}
                      <i className="ui icon mail" style={{float:"right"}}/>
                    </a>
                  </Restricted>
                  <Restricted perm="auth.modify_any">
                    {u.is_active ? (
                      <HoldButton className="item" onHoldClick={this.props.onDisableUser}>
                      {i18n("Hold to disable")}
                      <i className="ui icon trash user" style={{paddingLeft: 10}}/>
                      </HoldButton>
                    ) : (
                      <HoldButton className="item" onHoldClick={this.props.onEnableUser}>
                      {i18n("Hold to enable")}
                      <i className="ui icon enable user" style={{paddingLeft: 10}}/>
                      </HoldButton>
                    )}
                  </Restricted>
                </div>
              </div>
            </div>
          </Restricted>
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
        <h1>{i18n("Users")}</h1>

        <table className="ui table">
          <thead>
            <tr>
              <th>{i18n("Name")}</th>
              <th>{i18n("Email")}</th>
              <th>{i18n("Groups")}</th>
              <th>{i18n("Is active?")}</th>
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
        <Restricted perm="auth.create_user">
          <a onClick={this.handleOpenAddUser}><i className="ui massive button add icon floating olive"></i></a>
        </Restricted>
      </div>
    )
  }
})

export default Users
