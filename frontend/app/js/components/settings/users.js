import React from 'react'
import Loading from '../loading'

let Users=React.createClass({
  componentDidMount : function(){
    if (!this.props.users)
      this.props.loadUserList()

  },
  render: function(){
    if (!this.props.users)
      return (
        <Loading>User list</Loading>
      )

    $(this.refs.el).find('.ui.dropdown.button').dropdown()

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
            <tr key={u.email} className={u.is_active ? "" : "disabled"}>
              <td>{u.first_name} {u.last_name}</td>
              <td>{u.email}</td>
              <td>{u.groups.join(' + ')}</td>
              <td>{u.is_active ? "true" : "false"}
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    )
  }
})

export default Users
