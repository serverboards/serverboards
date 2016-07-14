import React, {PropTypes} from 'react';
import ResetPassword from './reset_password'
import SetPassword from './set_password'

var LoginView = React.createClass({
  getInitialState(){
    return { modal: undefined, email: undefined }
  },
  handleSubmit(ev){
    ev && ev.preventDefault()
    let $form = $(this.refs.el)

    if ($form.form('validate form')){
      let fields = $form.form('get values')
      this.props._onSubmit(
        Object.assign({type: 'basic'}, fields)
      )
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
    }).on('submit', self.handleSubmit)

    $(self.refs.el).find('[type=email]').focus()
  },
  resetPassword(email){
    this.setState({modal: 'reset_password', email})
  },
  setPassword(email){
    console.log("Set password %o", email)
    this.setState({modal: 'set_password', email})
  },
  render(){
    if (this.state.modal=='reset_password')
      return(
        <ResetPassword closeReset={() => this.setState({modal:undefined})} setPassword={this.setPassword} email={this.state.email}/>
      )
    if (this.state.modal=='set_password')
      return(
        <SetPassword closeReset={() => this.setState({modal:undefined})}  email={this.state.email}/>
      )

    return (
      <form ref="el" className="ui form" method="POST">
        <div className="ui small modal active" id="login">
          <div className="header">
            Login
          </div>

          <div className="content">
            <div className="field">
              <label>Email</label>
              <input type="email" name="email" placeholder="user@company.com"
                onChange={(ev) => {console.log(ev.target); this.setState({email: ev.target.value})}}
                />
            </div>

            <div className="field">
              <label>Password</label>
              <input type="password" name="password" placeholder="*******"
                />
            </div>
            <div className="ui error message"></div>
          </div>

          <div className="actions">
            <span className="ui checkbox action left" style={{float: "left"}}>
                <input type="checkbox" name="keep_logged_in" disabled/>
                <label>
                Keep logged login
              </label>
            </span>
            <a href="#" onClick={(ev) => { ev.preventDefault(); this.resetPassword(this.state.email)}}>Reset password</a>
            <button type="button" className="ui positive right labeled icon button" onClick={this.handleSubmit}>
              Login
              <i className="caret right icon"></i>
            </button>
          </div>
        </div>
      </form>
    )
  },
  propTypes: {
    _onSubmit: PropTypes.func.isRequired
  }
})


export default LoginView
