import React from 'react'
import Notifications from 'app/containers/profile/notifications'
import PasswordChange from './password_change'
import EditUser from 'app/components/settings/user/edit'
import Restricted from 'app/restricted'
import Flash from 'app/flash'
import rpc from 'app/rpc'
import {i18n} from 'app/utils/i18n'

class Profile extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      modal: undefined,
      avatar: this.props.avatar,
      lang: this.props.lang,
      tracking: this.props.tracking
    }
  }
  handleSubmit(){
    console.log("Submit %o",this.state)
    this.props.onSubmit(this.state)
  }
  handleUpdate(section, data){
    console.log("Update ", section, data)
    this.setState({ [section]: data })
  }
  openPasswordChange(ev){
    ev.preventDefault()
    this.setState({ modal: "change_password" })
  }
  openPersonalData(ev){
    ev.preventDefault()
    this.setState({ modal: "personal_data" })
  }
  componentDidMount(){
    const self=this
    $(this.refs.lang).dropdown({
      onChange(lang){
        // console.log("Set language to ", lang)
        self.setState({lang})
        self.props.onSetLanguage(lang)
      }
    })
    $(this.refs.tracking).checkbox()
    if (this.props.tracking)
      $(this.refs.tracking).checkbox("check")
    else
      $(this.refs.tracking).checkbox("uncheck")
  }
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
  }
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
      <div className="ui central area white background extends" style={{flexDirection: "column", maxHeight: "calc( 100vh - 70px )"}}>
        <div className="ui top secondary menu">
         <div className="right menu">
            <a className="item" href="#" onClick={this.openPersonalData.bind(this)}><i className="ui icon user"/>{i18n("Personal data")}</a>
            <a className="item" href="#" onClick={this.openPasswordChange.bind(this)}><i className="ui icon lock"/>{i18n("Change password")}</a>
          </div>
        </div>
        <div className="ui scroll" style={{maxHeight: "calc( 100vh - 140px )"}}>
          <div className="ui text container">
            <div style={{float:"left", margin: "0px 30px 30px 0"}}>
              <img src={state.avatar} className="ui bordered image medium" style={{width: 300, height: 300}}/>
              <div className="ui meta blue text"><label style={{cursor:"pointer"}}>{i18n("Upload new image")}<input onChange={this.uploadAvatar.bind(this)} style={{display:"none"}} type="file"/></label>.</div>
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

            <div style={{clear: "both"}}>
              <h2 className="ui header">{i18n("Usage tracking")}</h2>
              <div className="ui meta">
                {i18n("By letting Serverboards get information about your use of Serverboards allows us to center on the most used features and to detect failures on the wild.")}
                <br/>
                {i18n("We will not access any personal information, just general data as which functionalities and plugins are most used and errors.")}
              </div>
              <div className="ui inline field" ref="tracking">
                <div className="ui checkbox">
                  <input onChange={(ev) => this.handleUpdate("tracking", ev.target.checked)} type="checkbox" defaultChecked={props.tracking} id="tracking"/>
                  <label>{i18n("Allow Serverboards to track which functionalities I use.")}</label>
                </div>
              </div>
            </div>

            <div style={{clear:"both"}}/>

            <Restricted perm="settings.user.view">
              <Notifications user={props.user.email}
                onUpdate={(data) => this.handleUpdate("notifications", data)}/>
            </Restricted>
            <br/>
            <Restricted perm="settings.user.update">
              <button className="ui teal button" onClick={this.handleSubmit.bind(this)}>{i18n("Update profile")}</button>
            </Restricted>
            <div style={{height: 20}}></div>
          </div>
          {popup}
        </div>
      </div>
    )
  }
}

export default Profile
