import React from 'react'
import Notifications from 'app/containers/profile/notifications'
import PasswordChange from './password_change'
import gravatar from 'gravatar'

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
  render(){
    let popup=[]
    switch(this.state.modal){
      case "change_password":
        popup=(
          <PasswordChange onClose={() => this.setState({ modal: undefined })}/>
        )
    }
    let props = this.props
    const gravatar_url=gravatar.url(props.user.email, {s: 300})

    return (
      <div className="ui central area white background">
        <div className="ui top secondary menu">
         <div className="right menu">
            <a className="item" href="#" onClick={this.openPasswordChange}><i className="ui icon lock"/>Change password</a>
          </div>
        </div>
        <div className="ui text container">
          <img src={gravatar_url} className="ui image medium" style={{float:"left", margin: "0px 30px 30px 0", borderRadius: 3}}/>
          <h1 className="ui header">{props.user.first_name} {props.user.last_name}</h1>
          <h2 className="ui header">Basic user data</h2>
            <div className="ui inline field">
              <label>Email:</label> <span className="value">{props.user.email}</span>
            </div>
          <div style={{clear:"both"}}/>

          <Notifications user={props.user.email}
            onUpdate={(data) => this.handleUpdate("notifications", data)}/>

          <br/>
          <button className="ui yellow button" onClick={this.handleSubmit}>Update profile</button>
        </div>
        {popup}
      </div>
    )
  }
})

export default Profile
