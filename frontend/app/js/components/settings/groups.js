import React from 'react'
import Loading from '../loading'
import Table from '../maxtable'
import HoldButton from '../holdbutton'
import i18n from 'app/utils/i18n'

let Groups=React.createClass({
  handleEditUsers(g){
    this.props.setModal('auth.group.edit_users', { group: g })
  },
  handleEditPerms(g){
    this.props.setModal('auth.group.edit_perms', { group: g })
  },
  handleAddGroup(name){
    this.props.setModal('auth.group.add')
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
    let self=this

    function Group(g){
      return (
        <div key={g.name} style={{marginTop: 40, position: "relative"}}>
            <h2 className="ui dividing header">
              {g.name}
            </h2>
            {g.users.length == 0 ? (
              <span style={{position: "absolute", top: 5, right: 0}}>
              <HoldButton className="ui trash icon"
              data-content={i18n("Hold to remove from group")}
              onHoldClick={() => {self.props.onRemoveGroup(g.name)}}
              />
              </span>
            ) : undefined}
          <div className="ui grid two columns stackable">
            <div className="column">
              <h3 className="ui header">
                <span className="content">{i18n("Users")}</span>
                <a onClick={(ev) =>{ ev.preventDefault(); self.handleEditUsers(g) }} title={i18n("Edit users")} href="#!"> <i className="ui icon edit"/></a>
              </h3>
              <Table data={g.users} headers={[i18n("Email")]} onDelete={(u) => self.props.onRemoveUser(g.name, u)}/>
            </div>
            <div className="column">
              <h3 className="ui header">
                <span className="content">{i18n("Permissions")}</span>
                <a onClick={(ev) =>{ ev.preventDefault(); self.handleEditPerms(g) }} title={i18n("Edit users")} href="#!"> <i className="ui icon edit"/></a>
              </h3>
              <Table data={g.perms} headers={[i18n("Permission")]}/>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="ui text container">
        <h1>{i18n("Groups and permissions")}</h1>

        {props.groups.map(Group)}

        <a onClick={this.handleAddGroup} className="ui massive button _add icon floating orange">
          <i className="add icon"></i>
        </a>
      </div>
    )
  }
})

export default Groups
