import React from 'react'
import Modal from '../../modal'

const all_perms = [
    "auth.modify_self", "auth.modify_any",
    "auth.create_user", "auth.create_token",
    "auth.info_any_user",
    "auth.modify_groups", "auth.manage_groups",
    "plugin",
    "service.add", "service.update", "service.delete", "service.info",
    "service.component.add", "service.component.attach",
    "service.component.update", "service.component.delete",
    "debug"
  ]

let EditPerms=React.createClass({
  handleUpdatePermissions: function(){
    let current = $.makeArray($(this.refs.form)
      .find('input[type=checkbox]:checked'))
      .map( (f) => f.name )
    this.props.onUpdatePermissions(current)
  },
  componentDidMount : function(){
    let $form=$(this.refs.form)
    $form.form()
    $form.find('.ui.checkbox').checkbox()
  },
  render: function(){
    let props=this.props

    let perms=[]
    for (let p of all_perms){
      let checked=props.group.perms.indexOf(p) >= 0
      perms.push(
        <div key={p} className="field">
          <div className="ui checkbox">
            <input type="checkbox" defaultChecked={checked} name={p}/>
            <label>{p}</label>
          </div>
        </div>
      )
    }

    return (
      <Modal onClose={props.onClose}>
        <div className="header">
          Update perms at {props.group.name}
        </div>
        <div className="content">
          <label>Permissions</label>
          <form ref="form" className="ui form">
              {perms}
          </form>
        </div>
        <div className="actions">
          <div className="ui accept green button" onClick={this.handleUpdatePermissions}>Accept changes</div>
          <div className="ui cancel button" onClick={props.onClose}>Cancel</div>
        </div>
      </Modal>
    )
  }
})

export default EditPerms
