import React from 'react'
import Notifications from 'app/containers/profile/notifications'
import PasswordChange from './password_change'
import EditUser from 'app/components/settings/user/edit'
import Restricted from 'app/restricted'
import Flash from 'app/flash'
import rpc from 'app/rpc'
import {i18n} from 'app/utils/i18n'

let Profile = React.createClass({
  getInitialState(){
    return {
      modal: undefined,
      avatar: this.props.avatar,
      lang: this.props.lang
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
  componentDidMount(){
    const self=this
    $(this.refs.lang).dropdown({
      onChange(lang){
        console.log("Set language to ", lang)
        self.setState({lang})
        self.props.onSetLanguage(lang)
      }
    })
  },
  uploadAvatar(ev){
    let fr = new FileReader()
    fr.onload = (ev) => {
      this.setState({avatar: ev.target.result})
      rpc.call("settings.user.set", ["profile_avatar", {avatar: ev.target.result}]).then( () => {
        Flash.info(i18n("Avatar image saved"))
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
            onUpdateUser={this.props.onUpdateUser}
            />
        )
      break;
    }
    let {props, state} = this

    return (
      <div className="ui central area white background" style={{flexDirection: "column"}}>
        <div className="ui top secondary menu">
         <div className="right menu">
            <a className="item" href="#" onClick={this.openPersonalData}><i className="ui icon user"/>{i18n("Personal data")}</a>
            <a className="item" href="#" onClick={this.openPasswordChange}><i className="ui icon lock"/>{i18n("Change password")}</a>
          </div>
        </div>
        <div className="ui text container">
          <div style={{float:"left", margin: "0px 30px 30px 0"}}>
            <img src={state.avatar} className="ui bordered image medium" style={{width: 300, height: 300}}/>
            <div className="ui meta blue text"><label style={{cursor:"pointer"}}>{i18n("Upload new image")}<input onChange={this.uploadAvatar} style={{display:"none"}} type="file"/></label>.</div>
          </div>
          <h1 className="ui header">{props.user.name}</h1>
          <h2 className="ui header">{i18n("Basic user data")}</h2>
            <div className="ui inline field">
              <label>{i18n("Email")}:</label> <span className="value">{props.user.email}</span>
            </div>
          <h2 className="ui header">{i18n("Language")}</h2>
            <div className="ui inline field">

            <div className="ui selection dropdown" ref="lang">
              <input type="hidden" name="lang" defaultValue={this.state.lang}/>
              <i className="dropdown icon"/>
              <div className="default text">Language</div>
              <div className="menu">
                <div className="item" data-value="en"><i className="ui flag gb"/>English</div>
                <div className="item" data-value="es"><i className="ui flag es"/>Español</div>
              </div>
            </div>
          </div>

          <div style={{clear:"both"}}/>

          <Notifications user={props.user.email}
            onUpdate={(data) => this.handleUpdate("notifications", data)}/>

          <br/>
          <Restricted perm="settings.user.update">
            <button className="ui yellow button" onClick={this.handleSubmit}>{i18n("Update profile")}</button>
          </Restricted>
        </div>
        {popup}
      </div>
    )
  }
})

export default Profile
