import React from 'react';
import ResetPassword from './reset_password'
import SetPassword from './set_password'
import rpc from 'app/rpc'
import 'sass/login.sass'
import {i18n} from 'app/utils/i18n'
import {merge} from 'app/utils'
import PropTypes from 'prop-types'
import Flash from 'app/flash'

const white_logo=require('../../../imgs/white-horizontal-logo.svg')

class LoginView extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      modal: undefined,
      email: undefined,
    }
  }
  handleSubmit(ev){
    ev && ev.preventDefault()
    let $form = $(this.refs.el)

    if ($form.form('validate form')){
      let fields = $form.form('get values')
      this.props._onSubmit(
        merge({type: 'basic'}, fields)
      )
    }
  }
  componentDidMount( ){
    $(this.refs.el).form({
      on: 'blur',
      fields: {
        email: 'minLength[1]',
        password: 'minLength[6]'
      }
    }).on('submit', this.handleSubmit.bind(this))

    $(this.refs.el).find('[name=email]').focus()

    const token_match=window.location.hash.match(/pr=([-0-9a-fA-F]*)/)
    if (token_match){
      window.location.hash=''
      this.setState({modal: 'set_password', token: token_match[1]})
    }

    let maybe_error = $('meta[name=error]').attr('value') || ""
    if (maybe_error){
      if (maybe_error == 'not_allowed')
        maybe_error = i18n("Access not allowed.")
      if (maybe_error == 'invalid_params')
        maybe_error = i18n("Access params are not valid. Contact the plugin developer or check the Serverboards API.")
      Flash.error(maybe_error)
      window.history.replaceState({}, document.title, "/");
    }
    const maybe_token = $('meta[name=token]').attr('value') || ""
    if (maybe_token){
      window.history.replaceState({}, document.title, "/");
    }
  }
  resetPassword(email){
    this.setState({modal: 'reset_password', email})
  }
  setPassword(pw){
    this.setState({modal: 'set_password', pw})
  }
  render(){
    if (this.state.modal=='reset_password')
      return(
        <ResetPassword closeReset={() => this.setState({modal:undefined})} setPassword={this.setPassword.bind(this)} email={this.state.email}/>
      )
    if (this.state.modal=='set_password')
      return(
        <SetPassword closeReset={() => this.setState({modal:undefined})}  email={this.state.email} token={this.state.token}/>
      )
    const logging = this.props.logging

    return (
      <div className="ui login serverboards background diagonal">
      <form ref="el" className="ui form" method="POST">
        <img src={white_logo} className="ui serverboards logo"/>

        <div className="ui small modal active" id="login">
          <h1 className="ui huge header">
            {i18n("Login")}
          </h1>

          <div className="content">
            <div className="field">
              <label>{i18n("Email")}</label>
              <input type="text" name="email" placeholder="user@company.com"
                onChange={(ev) => {this.setState({email: ev.target.value})}}
                />
            </div>

            <div className="field">
              <label>{i18n("Password")}</label>
              <input type="password" name="password" placeholder="*******"
                />
            </div>
            <a href="#" onClick={(ev) => { ev.preventDefault(); this.resetPassword(this.state.email)}}>
              {i18n("Reset your password")}&nbsp;
              <i className="ui circle icon arrow right"/>
            </a>
            <div className="ui error message"></div>
          </div>

          <div className="ui centered actions">
            <button type="button"
              className={`ui wide login teal right labeled icon button ${logging ? "disabled" : ""}`}
              onClick={this.handleSubmit.bind(this)}>
                {i18n("Log In")}
                {logging ? (
                  <i className="loading spinner icon"></i>
                ) : (
                  <i className="caret right icon"></i>
                )}
            </button>
          </div>
        </div>
      </form>
      </div>
    )
  }
}

LoginView.propTypes = {
  _onSubmit: PropTypes.func.isRequired
}

LoginView.contextTypes = {
  router: PropTypes.object
}



export default LoginView
