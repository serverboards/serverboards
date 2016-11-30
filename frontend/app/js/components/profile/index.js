import React from 'react'
import Notifications from 'app/containers/profile/notifications'
import PasswordChange from './password_change'
import EditUser from 'app/components/settings/user/edit'
import Restricted from 'app/restricted'
import Flash from 'app/flash'
import rpc from 'app/rpc'

let Profile = React.createClass({
  getInitialState(){
    return {
      modal: undefined,
      avatar: this.props.avatar
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
  /*
  componentDidMount(){
    rpc.call("settings.user.get", ["profile_avatar"]).then( (d) => {
      if (d && d.avatar)
        this.setState({avatar: d.avatar})
    } ).error( (e) => console.log(e) )
  },
  */
  uploadAvatar(ev){
    let fr = new FileReader()
    fr.onload = (ev) => {
      this.setState({avatar: ev.target.result})
      rpc.call("settings.user.set", ["profile_avatar", {avatar: ev.target.result}]).then( () => {
        Flash.info("Avatar image saved")
        this.props.onUpdateAvatar(ev.target.result)
      })
    }
    fr.readAsDataURL(ev.target.files[0])
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
    let {props, state} = this

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
            <img src={state.avatar} className="ui bordered image medium" style={{width: 300, height: 300}}/>
            <div className="ui meta blue text"><label style={{cursor:"pointer"}}>Upload new image<input onChange={this.uploadAvatar} style={{display:"none"}} type="file"/></label>.</div>
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
