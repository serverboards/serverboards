import React from 'react'
import store from 'app/utils/store'
import rpc from 'app/rpc'

const default_avatar=require('../../imgs/square-favicon.svg')

const Avatar = React.createClass({
  getInitialState(){
    return {
      avatar: undefined
    }
  },
  componentDidMount(){
    const email = this.props.email
    if (email){
      const auth = store.getState().auth
      rpc.call("settings.user.get", [email, "profile_avatar"]).then( (avatar) => {
        this.setState({avatar: avatar.avatar})
      })
    }
  },
  render(){
    const avatar = this.state.avatar || default_avatar

    return (
      <img src={avatar} className={this.props.className}/>
    )
  }
})

export default Avatar
