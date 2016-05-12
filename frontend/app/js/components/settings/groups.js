import React from 'react'
import Loading from '../loading'

let Groups=React.createClass({
  componentDidMount: function(){
    if (!this.props.groups)
      this.props.loadGroups()
  },
  render(){
    let props=this.props
    if (!props.groups){
      return (
        <Loading>
        Loading groups
        </Loading>
      )
    }

    function Group(g){
      console.log(g)
      return (
        <li key={g.name}>
          <h2>{g.name}</h2>
          <hr/>
          <h3>Users</h3>
          {g.users.join(', ')}
          <h3>Permissions</h3>
          {g.perms.join(', ')}
        </li>
      )
    }

    return (
      <div className="ui text container">
        <h1>Groups and permissions</h1>

        <ul>
          {props.groups.map(Group)}
        </ul>
      </div>
    )
  }
})

export default Groups
