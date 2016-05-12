import React from 'react'
import Loading from '../loading'
import EditPerms from './group/edit_perms'
import EditUsers from './group/edit_users'

let Table=function(props){
  let max=3
  return (
    <div>
      <table className="ui table">
        <thead>
          <tr>
          {props.headers.map( (h) =>(
            <th key={h}>{h}</th>
          ))}
          </tr>
        </thead>
        <tbody>
          {props.data.slice(0,max).map( (u) => (
            <tr key={u}>
              <td>{u}</td>
            </tr>
          ) ) }
        </tbody>
      </table>
      {(props.data.length > max) ? `And ${props.data.length - max} more...`: ""}
    </div>
  )
}

let Groups=React.createClass({
  componentDidMount: function(){
    if (!this.props.groups)
      this.props.loadGroups()
    if (!this.props.users)
      this.props.loadUsers()
  },
  contextTypes: {
    router: React.PropTypes.object
  },
  setModal : function( what, data ){
    let modal=what && { what, data }

    console.log("Set router state modal %o", modal)

    this.context.router.push( {
      pathname: this.props.location.pathname,
      state: { modal }
    } )
  },
  getModal : function() {
    let router_state=this.props.location.state
    let modal_state = (router_state && router_state.modal && router_state.modal) || {}
    switch(modal_state.what){
      case 'edit_perms':
        return (
          <EditPerms
            group={modal_state.data}
            onClose={ () => this.setModal(false) }
            onUpdatePermissions={(perms) =>
              this.handleUpdatePermissions(modal_state.data, perms) }
          />
        )
        break;
      case 'edit_users':
        return (
          <EditUsers
            group={modal_state.data}
            onClose={ () => this.setModal(false) }
            onSubmit={(users) =>
              this.handleUpdateUsers(modal_state.data, users) }
            allUsers={this.props.all_users}
          />
        )
        break;
    }
    return []
  },
  handleEditUsers : function(g){
    this.setModal('edit_users', g)
  },
  handleEditPerms : function(g){
    this.setModal('edit_perms', g)
  },
  handleUpdatePermissions : function(g, new_perms){
    let to_remove_perms=$.makeArray( $(g.perms).not(new_perms) )
    let to_add_perms=$.makeArray( $(new_perms).not(g.perms) )

    this.props.onUpdatePerms(g.name, to_add_perms, to_remove_perms)
    this.setModal(false)
  },
  handleUpdateUsers : function(g, current){
    let to_add = $.makeArray( $(current).not(g.users) )
    let to_remove = $.makeArray( $(g.users).not(current) )

    this.props.onUpdateUsers(g.name, to_add, to_remove)
    this.setModal(false)
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

    let modal=this.getModal()
    let self=this

    function Group(g){
      return (
        <div key={g.name} style={{marginTop: 40}}>
          <h2 className="ui dividing header">{g.name}</h2>
          <div className="ui grid two columns stackable">
            <div className="column">
              <h3 className="ui header">
                <span className="content">Users</span>
                <a onClick={(ev) =>{ ev.preventDefault(); self.handleEditUsers(g) }} title="Edit users" href="#!"> <i className="ui icon edit"/></a>
              </h3>
              <Table data={g.users} headers={["Email"]}/>
            </div>
            <div className="column">
              <h3 className="ui header">
                <span className="content">Permissions</span>
                <a onClick={(ev) =>{ ev.preventDefault(); self.handleEditPerms(g) }} title="Edit users" href="#!"> <i className="ui icon edit"/></a>
              </h3>
              <Table data={g.perms} headers={["Permission"]}/>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="ui text container">
        <h1>Groups and permissions</h1>

        {props.groups.map(Group)}

        {modal}
      </div>
    )
  }
})

export default Groups
