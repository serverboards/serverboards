import React from 'react'
import Notifications from './notifications'


let Profile = React.createClass({
  getInitialState(){
    return {
    }
  },
  handleSubmit(){
    this.props.onSubmit(this.state)
  },
  handleUpdate(section, data){
    this.setState({ [section]: data })
  },
  render(){
    let props = this.props
    return (
      <div className="ui central area white background">
        <div className="ui text container" style={{"padding-top": "30px"}}>
          <h1 className="ui header">{props.user.email} profile</h1>
          <h2 className="ui header">Basic user data</h2>
          <span className="ui header">
            {props.user.email}
            </span>
          <dl>
            <dt>First name:</dt>
            <dd>{props.user.first_name}</dd>
            <dt>Last name:</dt>
            <dd>{props.user.last_name}</dd>
          </dl>

          <Notifications user={props.user.email} channels={props.channels}
            onUpdate={(data) => this.handleUpdate("notifications", data)}/>

          <br/>
          <button className="ui button green" onClick={this.handleSubmit}>Update profile</button>
        </div>
      </div>
    )
  }
})

export default Profile
