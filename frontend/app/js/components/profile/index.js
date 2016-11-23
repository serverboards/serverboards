import React from 'react'
import Notifications from 'app/containers/profile/notifications'
import PasswordChange from './password_change'
import gravatar from 'gravatar'
import EditUser from 'app/components/settings/user/edit'
import Restricted from 'app/restricted'

let Profile = React.createClass({
  getInitialState(){
    return {
      modal: undefined
    }
  },
  handleSubmit(){
    console.log("Submit %o",this.state)
    this.props.onSubmit(this.state)
  },
  handleUpdate(section, data){
    this.setState({ [section]: data })
  },
  openPasswordChange(ev){
    ev.preventDefault()
    this.setState({ modal: "change_password" })
  },
  openPersonalData(ev){
    ev.preventDefault()
    this.setState({ modal: "personal_data" })
  },
  render(){
    let popup=[]
    switch(this.state.modal){
      case "change_password":
        popup=(
          <PasswordChange onClose={() => this.setState({ modal: undefined })}/>
        )
      break;
      case "personal_data":
        popup=(
          <EditUser
            user={this.props.user}
            onClose={() => this.setState({ modal: undefined })}
            onSubmit={this.props.onUpdateUser}
            />
        )
      break;
    }
    let props = this.props
    const gravatar_url=gravatar.url(props.user.email, {s: 300})

    return (
      <div className="ui central area white background" style={{flexDirection: "column"}}>
        <div className="ui top secondary menu">
         <div className="right menu">
            <a className="item" href="#" onClick={this.openPersonalData}><i className="ui icon user"/>Personal data</a>
            <a className="item" href="#" onClick={this.openPasswordChange}><i className="ui icon lock"/>Change password</a>
          </div>
        </div>
        <div className="ui text container">
          <div style={{float:"left", margin: "0px 30px 30px 0"}}>
            <img src={gravatar_url} className="ui bordered image medium" style={{width: 300, height: 300}}/>
            <div className="ui meta">Image from <a href="https://gravatar.com" target="_blank" rel="noreferrer">Gravatar</a>.</div>
          </div>
          <h1 className="ui header">{props.user.name}</h1>
          <h2 className="ui header">Basic user data</h2>
            <div className="ui inline field">
              <label>Email:</label> <span className="value">{props.user.email}</span>
            </div>
          <div style={{clear:"both"}}/>

          <Notifications user={props.user.email}
            onUpdate={(data) => this.handleUpdate("notifications", data)}/>

          <br/>
          <Restricted perm="settings.user.update">
            <button className="ui yellow button" onClick={this.handleSubmit}>Update profile</button>
          </Restricted>
        </div>
        {popup}
      </div>
    )
  }
})

export default Profile
