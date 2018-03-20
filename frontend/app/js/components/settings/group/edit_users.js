import React from 'react'
import Modal from 'app/components/modal'
import i18n from 'app/utils/i18n'

class EditPerms extends React.Component{
  constructor(props){
    super(props)
    let users = this.props.group.users.map( (u) => ({email: u, is_active: true}) )
    let candidates_to_add = $.makeArray( $(this.props.all_users).not(this.props.group.users) )

    this.state = { users, candidates_to_add }
  }
  componentDidMount(){
    let $form=$(this.refs.form)
    $form.form()
    $form.find('.ui.checkbox').checkbox()
    $form.find('.ui.dropdown').dropdown()
  }
  handleAddUser(){
    let username=$(this.refs.form).find('select[name=to_add]').val()
    if (!username)
      return
    let users = this.state.users.concat({email: username, is_active: true})
    let candidates_to_add = this.state.candidates_to_add.filter( (u) => u!=username )

    this.setState({ users, candidates_to_add })

  }
  handleSubmit(){
    const current = $.makeArray(
        $(this.refs.form).find('input[type=checkbox]:checked')
      ).map( (f) => f.name )

    const g = this.props.group
    const to_add = $.makeArray( $(current).not(g.users) )
    const to_remove = $.makeArray( $(g.users).not(current) )

    this.props.onUpdateUsers(g.name, to_add, to_remove)
    this.props.setModal(false)
  }
  render(){
    let props=this.props

    return (
      <Modal onClose={props.onClose}>
        <div className="ui top secondary menu">
          <h3 className="ui header">
            {i18n("Update users at {name}", {name: props.group.name})}
          </h3>
        </div>
        <div className="ui content with padding">
          <form ref="form" className="ui form" onSubmit={(ev) => { ev.preventDefault(); this.handleSubmit() }}>
            <label className="ui header">Add new users</label>
            <div className="ui field inline">
              <label>User email</label>
              <select className="ui search dropdown" name="to_add">
              {this.state.candidates_to_add.map( (u) => (
                <option name={u}>{u}</option>
              ))}
              </select> &nbsp;
              <button type="button" className="ui right labeled icon button" onClick={this.handleAddUser.bind(this)}>
                <i className="ui icon add"/>
                Add</button>
            </div>

            <label className="ui header">Users</label>
            {this.state.users.map( (u) => (
              <div key={u.email} className="field">
                <div className="ui checkbox">
                  <input type="checkbox" defaultChecked={u.is_active} name={u.email}/>
                  <label>{u.email}</label>
                </div>
              </div>
            ))}
            <div className="field">
              <button type="button" className="ui accept teal button" onClick={this.handleSubmit.bind(this)}>Accept changes</button>
            </div>
          </form>
        </div>
      </Modal>
    )
  }
}

export default EditPerms
