import React from 'react';
import rpc from '../rpc'

class Login extends React.Component{
  constructor(props){
    super(props)

    this.state = { email: '', password: '' }

    // Really?? ES6 react...
    this.handle_submit=this.handle_submit.bind(this)
    this.update_password=this.update_password.bind(this)
    this.update_email=this.update_email.bind(this)
  }
  update_password(event){
    this.setState({password: event.target.value})
  }
  update_email(event){
    this.setState({email: event.target.value})
  }
  handle_submit(){
    if ($(this.refs.el).form('validate form')){
      rpc
        .call("auth.auth",{email:this.state.email, password:this.state.password, type:"basic"})
        .then(function(email){
          console.log("Got answer for login %o", email)
          if (email){
            console.log("Logged in as %o",email)
            this.props.onLogin()
          }
          else{
            console.error("Invalid password")
          }
        })
        .catch(function(msg){
          console.error("Cant login, %o", error)
        })
      console.log("Try log in")
    }
  }
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
  }
  render(){
    return (
      <form className="ui form" ref="el">
        <div className="ui small modal active" id="login">
          <div className="header">
            Login
          </div>

          <div className="content">
            <div className="field">
              <label>Email</label>
              <input type="email" name="email" placeholder="user@company.com"
                onChange={this.update_email} value={this.state.email}/>
            </div>

            <div className="field">
              <label>Password</label>
              <input type="password" name="password" placeholder="*******"
                onChange={this.update_password} value={this.state.password}/>
            </div>
            <div class="ui error message"></div>
          </div>

          <div className="actions">
            <button type="button" className="ui positive right labeled icon button"
              onClick={this.handle_submit}>
              Login
              <i className="caret right icon"></i>
            </button>
          </div>
        </div>
      </form>
    )
  }
}

export default Login;
