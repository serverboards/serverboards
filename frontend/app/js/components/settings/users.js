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

    function User(u){
      return (
        <li key={u.email}>
          <b>{u.email}</b> --
          {u.first_name} {u.last_name} --
          {u.is_active}
        </li>
      )
    }

    return (
      <div className="ui text container">
        <h1>Users</h1>

        <ul>
        {this.props.users.map((u) => User(u))}
        </ul>
      </div>
    )
  }
})

export default Users
