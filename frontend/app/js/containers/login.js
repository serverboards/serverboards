import React from 'react';
import rpc from '../rpc'
import Flash from '../flash'
import LoginView from '../components/login'

var Login=React.createClass({
  getInitialState(){
    return { email: '', password: '' }
  },
  handleSubmit(params){
    if ($(this.refs.el).form('validate form')){
      rpc
        .call("auth.auth",{email:params.email, password:params.password, type:"basic"})
        .then(function(user){
          if (user){
            this.props.onLogin(user)
            Flash.log("Logged in as "+user.email)
          }
          else{
            Flash.error("Invalid email/password")
          }
        }.bind(this))
        .catch(function(msg){
          console.error(msg)
          Flash.error("Cant login "+msg)
        })
    }
    else{
      Flash.error("Invalid email/password")
    }
  },
  componentDidMount( ){
    self=this
    $(this.refs.el).form({
      on: 'blur',
      fields: {
        email: 'email',
        password: 'minLength[6]'
      }
    })
    $(self.refs.el).find('[type=email]').focus()
  },
  render(){
    return (
      <LoginView _onSubmit={this.handleSubmit}/>
    )
  }
})

export default Login
